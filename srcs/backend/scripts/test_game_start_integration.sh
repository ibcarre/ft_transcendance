#!/usr/bin/env bash
# ft_transcendance — black-box HTTP + optional SQL game-start integration tests.
# Creates two test users and one test room. Run ONLY on disposable local data.
set -Eeuo pipefail
umask 077

# Locate srcs/.env regardless of the directory from which this script is called.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$REPO_ROOT/srcs/.env"

read_setting() {
  local key="$1"
  [[ -f "$ENV_FILE" ]] || return 0
  sed -nE "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*([^#[:space:]]+).*$/\1/p" "$ENV_FILE" | head -n 1
}

if [[ "${RUN_GAME_START_INTEGRATION:-}" != 1 ]]; then
  echo 'Run with: make game-integration-test (creates test accounts and a room).' >&2
  exit 2
fi

APP_PORT="${APP_PORT:-$(read_setting APP_PORT)}"
if [[ ! "$APP_PORT" =~ ^[0-9]+$ ]]; then
  echo "Cannot read APP_PORT from $ENV_FILE" >&2
  exit 2
fi
BASE_URL="${BASE_URL:-https://localhost:$APP_PORT}"
case "$BASE_URL" in
  https://localhost:*|https://127.0.0.1:*) ;;
  *) echo 'Refusing non-local BASE_URL. Use a disposable local environment.' >&2; exit 2 ;;
esac

CONTAINER="${CONTAINER:-$(read_setting CONTAINER)}"
if [[ -z "$CONTAINER" ]]; then
  if command -v podman >/dev/null; then CONTAINER=podman;
  elif command -v docker >/dev/null; then CONTAINER=docker;
  else CONTAINER=podman; fi
fi
DB_CONTAINER="${DB_CONTAINER:-postgres_skyjo}"
CHECK_SQL="${CHECK_SQL:-1}"
TEST_CONCURRENT="${TEST_CONCURRENT:-1}"

for cmd in curl jq mktemp; do
  command -v "$cmd" >/dev/null || { echo "Missing dependency: $cmd" >&2; exit 2; }
done

if [[ "$CHECK_SQL" == 1 ]]; then
  command -v "$CONTAINER" >/dev/null || {
    echo "Missing container executable: $CONTAINER" >&2; exit 2;
  }
  "$CONTAINER" container inspect "$DB_CONTAINER" >/dev/null 2>&1 || {
    echo "Cannot inspect $DB_CONTAINER with $CONTAINER; start the stack or run with CHECK_SQL=0." >&2
    exit 2
  }
fi

TMPDIR_TEST="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_TEST"' EXIT
COOKIE_A="$TMPDIR_TEST/alice.cookies"
COOKIE_B="$TMPDIR_TEST/bob.cookies"
RESPONSE="$TMPDIR_TEST/response.body"
REQUEST_INFO="$TMPDIR_TEST/request.info"
ID="$(date +%s)${RANDOM}"
ALICE="Ga${ID}A"
BOB="Ga${ID}B"
ROOM="R${ID}"
PASSWORD='Skyjo!Pass1234'
ROOM_PASSWORD='TestRoom!2026'
GAME_ID=''
PASS=0

die() {
  printf '\nFAIL: %s\n' "$*" >&2
  if [[ -s "$REQUEST_INFO" ]]; then
    printf 'Request: ' >&2; cat "$REQUEST_INFO" >&2; printf '\n' >&2
  fi
  if [[ -s "$RESPONSE" ]]; then
    echo 'Last response body:' >&2
    if jq -e . "$RESPONSE" >/dev/null 2>&1; then
      jq . "$RESPONSE" >&2
    else
      head -c 2000 "$RESPONSE" >&2
      printf '\n' >&2
    fi
  fi
  exit 1
}
check() {
  local what="$1" expected="$2" actual="$3"
  [[ "$actual" == "$expected" ]] || die "$what — expected '$expected', got '$actual'"
  echo "PASS: $what ($actual)"
  PASS=$((PASS+1))
}

# request <cookiejar|-> <HTTP method> <path> [JSON body]
request() {
  local jar="$1" method="$2" path="$3" data="${4-}" opts=()
  printf '%s %s%s\n' "$method" "$BASE_URL" "$path" > "$REQUEST_INFO"
  if [[ "$jar" != '-' ]]; then opts=(-b "$jar" -c "$jar"); fi
  if [[ "$#" -ge 4 ]]; then
    curl --connect-timeout 5 --max-time 20 -ksS -o "$RESPONSE" -w '%{http_code}' \
      "${opts[@]}" -H 'Content-Type: application/json' \
      -X "$method" --data "$data" "$BASE_URL$path"
  else
    curl --connect-timeout 5 --max-time 20 -ksS -o "$RESPONSE" -w '%{http_code}' \
      "${opts[@]}" -X "$method" "$BASE_URL$path"
  fi
}
field() {
  local value
  value="$(jq -r "$1" "$RESPONSE" 2>/dev/null)" || die "Invalid JSON for field: $1"
  [[ -n "$value" && "$value" != null ]] || die "Missing JSON field: $1"
  printf '%s\n' "$value"
}
# createRoom currently returns a raw UUID as text, not JSON.
# Also support a future JSON string or {id: ...} response.
room_id_from_response() {
  local raw id
  raw="$(tr -d '\r\n' < "$RESPONSE")"
  if [[ "$raw" =~ ^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$ ]]; then
    id="$raw"
  else
    id="$(jq -er 'if type == "string" then . elif type == "object" then (.id // .roomId // empty) else empty end' "$RESPONSE" 2>/dev/null)" ||
      die 'Unexpected createRoom response: expected a raw UUID or JSON id'
  fi
  [[ "$id" =~ ^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$ ]] ||
    die "Invalid room UUID: $id"
  printf '%s\n' "${id,,}"
}

# sql executes SELECTs using the existing Postgres container; it never modifies data.
sql() {
  "$CONTAINER" exec "$DB_CONTAINER" sh -c \
    'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1 -c "$1"' sh "$1"
}

printf 'Endpoint: %s\nTest users: %s, %s\nTest room: %s\n\n' "$BASE_URL" "$ALICE" "$BOB" "$ROOM"

for entry in "A:$ALICE:$COOKIE_A" "B:$BOB:$COOKIE_B"; do
  IFS=: read -r suffix username jar <<< "$entry"
  body="$(jq -nc --arg username "$username" --arg email "skyjo.${ID}.${suffix}@example.com" --arg password "$PASSWORD" '{username:$username,email:$email,password:$password}')"
  code="$(request "$jar" POST '/api/user/signup' "$body")"
  check "signup $suffix" 201 "$code"
  code="$(request "$jar" GET '/api/user/profile')"
  check "authenticated profile $suffix" 200 "$code"
  uid="$(field '.id')"
  case "$suffix" in A) ALICE_ID="$uid" ;; B) BOB_ID="$uid" ;; esac
  [[ "$uid" =~ ^[0-9a-f-]{36}$ ]] || die "Invalid profile UUID: $uid"
done

# Fail early if the backend image has not picked up the new /start route.
code="$(request "$COOKIE_A" POST '/api/rooms/not-a-uuid/start' '{}')"
check 'game-start route deployed (authenticated probe)' 400 "$code"
check 'game-start route responds with JSON' INVALID_ROOM_ID "$(field '.error.code')"

code="$(request '-' POST '/api/rooms/00000000-0000-4000-8000-000000000000/start' '{}')"
check 'no cookie rejected' 401 "$code"

body="$(jq -nc --arg name "$ROOM" --arg password "$ROOM_PASSWORD" '{name:$name,max_players:2,password:$password}')"
code="$(request "$COOKIE_A" POST '/api/rooms/createRoom' "$body")"
check 'room created' 201 "$code"
GAME_ID="$(room_id_from_response)"
echo "Room UUID: $GAME_ID"

code="$(request "$COOKIE_A" POST '/api/rooms/not-a-uuid/start' '{}')"
check 'malformed room ID rejected' 400 "$code"
check 'malformed code' INVALID_ROOM_ID "$(field '.error.code')"

code="$(request "$COOKIE_A" POST '/api/rooms/00000000-0000-4000-8000-000000000000/start' '{}')"
check 'missing room rejected' 404 "$code"
check 'missing room code' ROOM_NOT_FOUND "$(field '.error.code')"

code="$(request "$COOKIE_B" POST "/api/rooms/$GAME_ID/start" '{}')"
check 'non-owner start rejected' 403 "$code"
check 'non-owner code' NOT_ROOM_OWNER "$(field '.error.code')"

code="$(request "$COOKIE_A" POST "/api/rooms/$GAME_ID/start" '{}')"
check 'one player cannot start' 409 "$code"
check 'incomplete room code' ROOM_STATE_INVALID "$(field '.error.code')"

if [[ "$CHECK_SQL" == 1 ]]; then
  check 'pending DB status' pending "$(sql "SELECT status FROM games WHERE id = '$GAME_ID';")"
  check 'one participant DB' 1 "$(sql "SELECT count(*) FROM users_in_game WHERE game_id = '$GAME_ID';")"
fi

body="$(jq -nc --arg password "$ROOM_PASSWORD" '{password:$password}')"
code="$(request "$COOKIE_B" POST "/api/rooms/joinRoom/$GAME_ID" "$body")"
check 'second player joins' 201 "$code"
if [[ "$CHECK_SQL" == 1 ]]; then
  check 'two participants DB' 2 "$(sql "SELECT count(*) FROM users_in_game WHERE game_id = '$GAME_ID';")"
  check 'distinct seats' 2 "$(sql "SELECT count(DISTINCT seat) FROM users_in_game WHERE game_id = '$GAME_ID';")"
  check 'room counter' 2 "$(sql "SELECT nb_players FROM games WHERE id = '$GAME_ID';")"
fi

if [[ "${TEST_CONCURRENT:-0}" == 1 ]]; then
  # Start the same room twice at once. Exactly one request must win.
  curl -ksS -o "$TMPDIR_TEST/parallel1.json" -w '%{http_code}' \
    -b "$COOKIE_A" -H 'Content-Type: application/json' \
    -X POST --data '{}' "$BASE_URL/api/rooms/$GAME_ID/start" > "$TMPDIR_TEST/parallel1.status" &
  pid1=$!
  curl -ksS -o "$TMPDIR_TEST/parallel2.json" -w '%{http_code}' \
    -b "$COOKIE_A" -H 'Content-Type: application/json' \
    -X POST --data '{}' "$BASE_URL/api/rooms/$GAME_ID/start" > "$TMPDIR_TEST/parallel2.status" &
  pid2=$!
  wait "$pid1" || die 'first concurrent curl failed'
  wait "$pid2" || die 'second concurrent curl failed'
  s1="$(cat "$TMPDIR_TEST/parallel1.status")"
  s2="$(cat "$TMPDIR_TEST/parallel2.status")"
  check 'exactly one concurrent start succeeded' '201 409' "$(printf '%s\n%s\n' "$s1" "$s2" | sort -n | paste -sd' ' -)"
  if [[ "$s1" == 201 ]]; then
    cp "$TMPDIR_TEST/parallel1.json" "$RESPONSE"
    losing_file="$TMPDIR_TEST/parallel2.json"
  else
    cp "$TMPDIR_TEST/parallel2.json" "$RESPONSE"
    losing_file="$TMPDIR_TEST/parallel1.json"
  fi
  losing_code="$(jq -er '.error.code' "$losing_file")"
  case "$losing_code" in
    START_IN_PROGRESS|ROOM_NOT_PENDING) echo "PASS: losing start rejected ($losing_code)"; PASS=$((PASS+1));;
    *) die "Unexpected loser code $losing_code";;
  esac
else
  code="$(request "$COOKIE_A" POST "/api/rooms/$GAME_ID/start" '{}')"
  check 'valid room starts' 201 "$code"
fi
check 'start returns ok' true "$(field '.ok')"
check 'initial phase' INITIAL_REVEAL "$(field '.publicState.phase')"
check 'initial version' 0 "$(field '.publicState.version')"
check 'initial round' 1 "$(field '.publicState.roundNumber')"
check 'target score' 100 "$(field '.publicState.targetScore')"
check 'correct room ID' "$GAME_ID" "$(field '.publicState.id')"
check 'two game participants' 2 "$(field '.publicState.players | length')"
check 'creator at seat zero' "$ALICE_ID" "$(field '.publicState.players[0].id')"
check 'joiner at seat one' "$BOB_ID" "$(field '.publicState.players[1].id')"
check 'creator has 12 hidden slots' 12 "$(field '[.publicState.players[0].board[] | select(.status == "hidden")] | length')"
check 'joiner has 12 hidden slots' 12 "$(field '[.publicState.players[1].board[] | select(.status == "hidden")] | length')"
check 'private deck not leaked' false "$(field '.publicState | has("deck")')"
check 'private discard pile not leaked' false "$(field '.publicState | has("discardPile")')"
check 'private turn queue not leaked' false "$(field '.publicState | has("finalTurnQueue")')"
check 'hidden cards contain no values' 0 "$(field '[.publicState.players[].board[] | select(.status == "hidden" and (has("value") or has("card")))] | length')"
check 'initial turn stage is null' true "$(field '.publicState.turnStage == null')"
check 'initial current player is null' true "$(field '.publicState.currentPlayerId == null')"
if [[ "$CHECK_SQL" == 1 ]]; then
  check 'playing DB status' playing "$(sql "SELECT status FROM games WHERE id = '$GAME_ID';")"
  check 'two participants persist' 2 "$(sql "SELECT count(*) FROM users_in_game WHERE game_id = '$GAME_ID';")"
fi

code="$(request "$COOKIE_A" POST "/api/rooms/$GAME_ID/start" '{}')"
check 'repeat start rejected' 409 "$code"
check 'repeat start code' ROOM_NOT_PENDING "$(field '.error.code')"

printf '\nSUCCESS — %d checks passed.\n' "$PASS"
printf 'Created test accounts: %s, %s\nCreated game: %s\n' "$ALICE" "$BOB" "$GAME_ID"
printf 'Game remains playing in this backend process. Test data is intentionally NOT deleted.\n'
printf 'Run only against a disposable development DB.\n'
