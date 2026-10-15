#!/usr/bin/env bash

set -uo pipefail

# Always execute from the backend root, regardless of the caller's directory.
cd "$(dirname "$0")/.." || exit 1

if command -v tsx >/dev/null 2>&1; then
    tsx_command=$(command -v tsx)
elif [[ -x ./node_modules/.bin/tsx ]]; then
    tsx_command=./node_modules/.bin/tsx
else
    printf 'ERROR: tsx was not found. Run npm ci first.\n' >&2
    exit 1
fi

log_file=$(mktemp) || exit 1
trap 'rm -f "$log_file"' EXIT

passed=0
total=0
failed=0
skipped=0
cancelled=0
todo=0
failed_groups=0

# Extract Node's official totals.
# Use the final TAP summary in each file. If the summary is missing, fail safely.
read_counts() {
    awk '
        /^# tests [0-9]+$/     { tests = $3; has_tests = 1 }
        /^# pass [0-9]+$/      { pass = $3; has_pass = 1 }
        /^# fail [0-9]+$/      { fail = $3; has_fail = 1 }
        /^# skipped [0-9]+$/   { skipped = $3; has_skipped = 1 }
        /^# cancelled [0-9]+$/ { cancelled = $3; has_cancelled = 1 }
        /^# todo [0-9]+$/      { todo = $3; has_todo = 1 }
        END {
            if (!has_tests || !has_pass || !has_fail || !has_skipped ||
                !has_cancelled || !has_todo) exit 1
            printf "%d %d %d %d %d %d\n", tests, pass, fail, skipped, cancelled, todo
        }
    ' "$log_file"
}

run_test() {
    local name="$1"
    local file="$2"
    local status=0
    local counts
    local group_total=0 group_passed=0 group_failed=0
    local group_skipped=0 group_cancelled=0 group_todo=0

    "$tsx_command" --test --test-reporter=tap "$file" >"$log_file" 2>&1 || status=$?

    if counts=$(read_counts); then
        read -r group_total group_passed group_failed group_skipped \
            group_cancelled group_todo <<< "$counts"
        total=$((total + group_total))
        passed=$((passed + group_passed))
        failed=$((failed + group_failed))
        skipped=$((skipped + group_skipped))
        cancelled=$((cancelled + group_cancelled))
        todo=$((todo + group_todo))
    else
        status=1
    fi

    if (( status == 0 && group_total > 0 && group_passed == group_total )); then
        printf '  [PASS] %-49s %3d/%-3d\n' "$name" "$group_passed" "$group_total"
    else
        failed_groups=$((failed_groups + 1))
        printf '  [FAIL] %s (%d/%d passed)\n' "$name" "$group_passed" "$group_total"
        printf '         Details from %s:\n' "$file"
        cat "$log_file"
    fi
}

printf '\n===============================================================\n'
printf '  SKYJO GAME ENGINE - TEST REPORT\n'
printf '===============================================================\n\n'

run_test "createDeck()"						"game/test/createDeck.test.ts"
run_test "shuffleDeck()"					"game/test/shuffleDeck.test.ts"
run_test "takeTopCard()"					"game/test/takeTopCard.test.ts"
run_test "Board / column resolution"		"game/test/board.test.ts"
run_test "Final board resolution"			"game/test/finalBoard.test.ts"
run_test "Turn order / finisher helpers"	"game/test/turn.test.ts"
run_test "createGame()"						"game/test/createGame.test.ts"
run_test "buildPublicState()"				"game/test/publicState.test.ts"
run_test "State machine phases"				"game/test/stateMachine.test.ts"
run_test "REVEAL_INITIAL_CARD"				"game/test/revealInitialCard.test.ts"
run_test "DRAW_DECK / DRAW_DISCARD"			"game/test/drawCard.test.ts"
run_test "SWAP_CARD"						"game/test/swapCard.test.ts"
run_test "DISCARD_DRAWN_CARD"				"game/test/discardDrawnCard.test.ts"
run_test "REVEAL_CARD"						"game/test/revealCard.test.ts"

printf '\n------------------------------------------------------------\n'
printf '  RESULT: %d / %d tests passed\n' "$passed" "$total"
printf '  Failed: %d  |  Skipped: %d  |  Cancelled: %d  |  Todo: %d\n' \
    "$failed" "$skipped" "$cancelled" "$todo"

if (( failed_groups == 0 && total > 0 && passed == total )); then
    printf '  STATUS: PASS\n'
    printf '============================================================\n\n'
    exit 0
fi

printf '  STATUS: FAIL (%d failing or incomplete test groups)\n' "$failed_groups"
printf '============================================================\n\n'
exit 1
