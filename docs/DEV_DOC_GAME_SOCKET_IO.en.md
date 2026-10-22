# Game transport — Socket.IO (`/Rooms`)

The HTTP endpoint `POST /api/rooms/:roomId/start` starts a game. The client
uses the existing authenticated Socket.IO namespace `/Rooms` for game actions.
This protocol is separate from the existing lobby events in `/Rooms`.

## Authentication

The Socket.IO `checkAuth` middleware verifies the `access_token` cookie and
populates `socket.user.id`. Client-supplied `playerId` is never trusted. A
player may subscribe to or act on a game only if they belong to its GameManager
state. A user without membership gets `GAME_UNAVAILABLE`, the same as an
unknown game.

## Commands and broadcasts

- `game:subscribe` (client → server, acknowledgment): `{ gameId }`.
  Returns `{ ok: true, publicState }` and joins the private room `game:<id>`;
  otherwise returns `{ ok: false, error: { code } }`. Joining again returns
  a fresh snapshot (for reconnect / resynchronization).
- `game:action` (client → server, acknowledgment):
  `{ gameId, expectedVersion, action }`. `action` uses the `ClientGameAction`
  payload format, e.g. `{ type: 'REVEAL_INITIAL_CARD', position: 0 }`. Returns
  the same structured `ManagerResult` as `submitAction()`; it rejects malformed
  envelopes, invalid commands, illegal actions and stale versions.
- `game:state` (server → subscribed sockets): the complete `PublicGameState`.
  Sent **only after an accepted** `game:action`; never after a refusal. The
  originating socket receives it too, if subscribed.

**Always use Socket.IO acknowledgment callbacks for the first two events.**
Never send `GameState` to the browser; only `PublicGameState` is distributed.

## State synchronization

The client should register the `game:state` listener before subscribing. On
reconnect, resubscribe and replace the local state with the returned snapshot.
Ignore state updates from older versions. Use the current `publicState.version`
for `expectedVersion`. On `VERSION_CONFLICT`, resubscribe and retry only after
re-evaluating the user's intended action; do not replay blindly.

## Planned client connection lifecycle

The multiplayer game page will own a dedicated Socket.IO connection
(`forceNew: true`) and disconnect it when the page unmounts or the
game changes.

Socket.IO automatically removes disconnected sockets from their rooms.
Therefore, no `game:unsubscribe` event is currently required.

The backend does not enforce a single game subscription per socket.
If a shared Socket.IO connection or simultaneous game subscriptions
become necessary, this lifecycle must be revisited.

This is the planned React integration contract; it is not implemented
in the frontend yet.

## Scope and remaining work

This transport does not yet automate room-start notifications, end-of-round
advancement, results persistence, abandoned games, timers or front-end state
management. The lobby must still notify clients that a `pending` room has
transitioned to `playing`, or the clients must independently navigate and
subscribe using the known room/game identifier.

## Verification

From the repository root:

```sh
make game-test            # unit, manager, service, protocol tests
make game-realtime-test   # black-box HTTP + Socket.IO over Nginx (disposable DB)
```

The real transport test runs from the frontend container to reuse its existing
`socket.io-client` dependency. The local/CI TLS-bypass environment variable is
scoped to this isolated test process only. It creates three test users and a
room, and does **not** delete them; never run against shared or production data.
