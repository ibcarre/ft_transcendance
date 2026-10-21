# Skyjo — Game Engine and GameManager Developer Guide

> **Purpose:** This document describes the available interfaces, exchanged data, enforced rules, and errors to handle.
>
> **Scope:** `srcs/backend/game/` (game engine) and `srcs/backend/src/game/GameManager.ts` (game management). The paths below are relative to `srcs/backend/`.

## TL;DR — The essentials in one minute

- **Use `GameManager` for player interactions.** It keeps games in memory, checks player membership, validates commands and versions, and returns a public state.
- **Never send `GameState` to a client.** Manager responses contain `PublicGameState`, which hides unrevealed cards and the contents of the draw deck.
- **Six commands** are available: `REVEAL_INITIAL_CARD`, `DRAW_DECK`, `DRAW_DISCARD`, `SWAP_CARD`, `DISCARD_DRAWN_CARD`, `REVEAL_CARD`. Actions targeting a board slot use a position **from `0` to `11`**.
- **One successful command = `version + 1`.** Pass the current version to `submitAction()`; use the version from each newly received state. Errors do not modify the stored game.
- **Identity:** `userId` comes from the server (authenticated user), **never from the command's JSON**. The manager adds `playerId` itself.
- **End of round:** When the state enters `ROUND_FINISHED`, the server can call `advanceRound()` with the current version. `GAME_OVER` is terminal.
- **Typical results:** `{ ok: true, publicState }` or `{ ok: false, error: { code } }`. Invalid creation inputs yield `INVALID_GAME_INPUT`. Internal failures, including an invalid random source, may still throw JavaScript exceptions.

### Quick navigation

1. [Usage: the manager's five methods](#1-using-the-gamemanager)
2. [Commands: what to send, and when?](#2-commands-and-game-lifecycle)
3. [Responses: which fields to use?](#3-public-state-and-essential-types)
4. [Errors: codes and handling](#4-errors-and-exceptions)
5. [Rules that affect integration](#5-rules-and-behaviors-to-know)
6. [Direct engine API and utilities](#6-direct-game-engine-api)
7. [Integration responsibilities and tests](#7-integration-contract-and-tests)

---

## 1. Using the `GameManager`

**Entry point:** `src/game/GameManager.ts` — `export class GameManager`.

The manager holds a private `Map<GameId, GameState>`. A single instance manages multiple games, **without persistence**: the same instance must be retained to access its games again. It does not authenticate connections; the caller must supply a verified `userId`.

| Method | Parameters | Success / effect | Return | Failure |
|---|---|---|---|---|
| `new GameManager(random?)` | `random?: () => number` | Initializes an independent manager; defaults to `Math.random`. | `GameManager` | — |
| `create(input)` | `input: CreateGameInput` | Stores a new game in `INITIAL_REVEAL`, `version: 0`. | `ManagerResult` | `GAME_ALREADY_EXISTS`, `INVALID_GAME_INPUT`; possible exception for internal failures. |
| `getPublicState(gameId, userId)` | `gameId: GameId`, `userId: PlayerId` | Reads the public state if the player belongs to the game, **without modifying it**. | `ManagerResult` | `GAME_UNAVAILABLE`. |
| `submitAction(gameId, userId, payload, expectedVersion)` | `GameId`, `PlayerId`, `unknown`, `number` | Validates the action, stores the new state, and increments its version. | `ManagerResult` | Version, payload, or game-rule error: [§4](#4-errors-and-exceptions). |
| `advanceRound(gameId, expectedVersion)` | `GameId`, `number` | From `ROUND_FINISHED`, creates the next round (`version + 1`). | `ManagerResult` | `GAME_UNAVAILABLE`, `INVALID_ACTION_PAYLOAD`, `VERSION_CONFLICT`, `INVALID_GAME_PHASE`. |
| `remove(gameId)` | `gameId: GameId` | Removes the game from the manager's memory. | `boolean` (`true` if removed, `false` if absent) | — (no error code). |

`GameId` and `PlayerId` are aliases for `string`. `CreateGameInput` has the shape `{ id: string; players: { id: string }[]; targetScore?: number }`.

**Creation constraints:** The input must be an object `{ id, players, targetScore? }` containing `2` to `4` players. Game and player IDs must be non-empty strings (whitespace-only strings are rejected), and player IDs must be unique. `targetScore` must be a strictly positive safe integer; it **defaults to `100` when absent or `undefined`**, while `null` is invalid.

Validation is shared between the engine and the manager, but their behavior differs: `GameManager.create()` returns `INVALID_GAME_INPUT` for invalid creation data, whereas calling `createGame()` directly throws an explicit exception.

IDs are not normalized, and the manager does not check their existence in the database. Invalid creation attempts neither mutate existing games nor reserve the requested game ID. Input validation takes precedence over the duplicate game ID check.

**Shared return format** (`create`, `getPublicState`, `submitAction`, `advanceRound`):

```ts
type ManagerResult =
  | { ok: true; publicState: PublicGameState }
  | { ok: false; error: { code: ManagerErrorCode } };
```

A successful call returns **the complete public state** (not merely an acknowledgment or an internal `GameState`); a failed call returns **only an error code**, without `publicState`. Thrown exceptions (`throw`) are not `ManagerResult` values: see [§4](#4-errors-and-exceptions).

**Three integration guidelines:**

- **Identity and command:** `userId` is supplied by the server after authentication. `payload` describes only the action (`type`, and sometimes `position`); the manager adds `playerId` itself (see [§2](#2-commands-and-game-lifecycle)).
- **Version:** `expectedVersion` must be the most recent `publicState.version`; every accepted `submitAction()` and successful `advanceRound()` increments it by `1`. `getPublicState()` is read-only and useful for resynchronizing after `VERSION_CONFLICT`.
- **Trusted operations:** `advanceRound()` and `remove()` have **no** `userId` parameter: the caller controls when they are invoked and who is authorized to invoke them. `remove()` returns `true` or `false` directly, **never** a `ManagerResult`.

### Minimal example

```ts
import { GameManager } from "./src/game/GameManager";

const manager = new GameManager();
const created = manager.create({
  id: "game-1",
  players: [{ id: "alice" }, { id: "bob" }],
});
if (!created.ok) throw new Error(created.error.code);

const result = manager.submitAction(
  "game-1",
  "alice", // ID obtained from server-side authentication
  { type: "REVEAL_INITIAL_CARD", position: 0 },
  created.publicState.version,
);

if (result.ok) {
  // Broadcast result.publicState to authorized participants.
} else {
  // Respond with result.error.code; the state has not changed.
}
```

Each participant reveals two cards at the beginning: after the example above, the game is **still** in the `INITIAL_REVEAL` phase.

## 2. Commands and game lifecycle

### 2.1 State machine: which action is allowed?

| `phase` | `turnStage` | Authorized actor and commands |
|---|---|---|
| `INITIAL_REVEAL` | `null` | Each player reveals **two** of their cards: `REVEAL_INITIAL_CARD(position)`, with no required order between players. |
| `PLAYING` | `WAITING_FOR_DRAW` | Current player: `DRAW_DECK` **or** `DRAW_DISCARD`. |
| `PLAYING` | `DRAWN_FROM_DECK` | Current player: `SWAP_CARD(position)` **or** `DISCARD_DRAWN_CARD`. |
| `PLAYING` | `MUST_SWAP_DISCARD` | Current player: `SWAP_CARD(position)` **required**. |
| `PLAYING` | `MUST_REVEAL_CARD` | Current player: `REVEAL_CARD(position)` **required**. |
| `ROUND_FINISHED` | `null` | No player commands. Proceed to the next round via `advanceRound()`. |
| `GAME_OVER` | `null` | Game ended; no further game commands or rounds. |

`currentPlayerId` indicates who may act during `PLAYING`; it is `null` during the initial reveal and after a round has finished. Actions are validated **by the engine**: this table can also drive the UI, but does not replace those checks.

### 2.2 Exact payloads and effects

`payload` contains **only** `type` and, when required, `position`. **No `playerId`, no `expectedVersion`, and no additional properties** inside this object. The version is a separate argument to `submitAction()`.

| Command (JSON object) | Effect and next step |
|---|---|
| `{ "type": "REVEAL_INITIAL_CARD", "position": 0 }` | Reveals the selected hidden card. Once *every* player has revealed their second card, the phase automatically changes to `PLAYING`. |
| `{ "type": "DRAW_DECK" }` | Draws a card; `pendingCard.source = "DECK"`; moves to `DRAWN_FROM_DECK`. |
| `{ "type": "DRAW_DISCARD" }` | Takes the visible top card from the discard pile; source `DISCARD`; moves to `MUST_SWAP_DISCARD`. |
| `{ "type": "SWAP_CARD", "position": 7 }` | Replaces **even an already revealed card**, but not a removed slot; places the drawn card face up, discards the replaced card, and **ends the turn**. |
| `{ "type": "DISCARD_DRAWN_CARD" }` | Discards a card drawn from the **deck** only, then requires `MUST_REVEAL_CARD`. **Does not end the turn.** |
| `{ "type": "REVEAL_CARD", "position": 11 }` | Reveals a card that is **still hidden** and **ends the turn**. |

Turn flow:

```text
WAITING_FOR_DRAW
├─ DRAW_DISCARD ──> MUST_SWAP_DISCARD ── SWAP_CARD ───────────────┐
└─ DRAW_DECK ────> DRAWN_FROM_DECK ──┬─ SWAP_CARD ────────────────┤
                                    └─ DISCARD_DRAWN_CARD        │
                                       └─ MUST_REVEAL_CARD       │
                                          └─ REVEAL_CARD ────────┘
                                                    End of turn
```

**Board positions:** Indices follow rows (not columns).

```text
 0   1   2   3
 4   5   6   7
 8   9  10  11
```

A column is therefore `{0,4,8}`, `{1,5,9}`, `{2,6,10}`, or `{3,7,11}`. A position must be an integer between `0` and `11`; a removed slot can no longer be targeted. `SWAP_CARD` accepts a hidden or revealed slot; both reveal actions require a hidden slot.

### 2.3 Advancing to the next round

When a turn ends the round, **the result of that action** already contains the scores and the `ROUND_FINISHED` or `GAME_OVER` phase.

```ts
if (result.ok && result.publicState.phase === "ROUND_FINISHED") {
  // Trigger from server-side logic, at the time chosen by the application.
  const next = manager.advanceRound(
    result.publicState.id,
    result.publicState.version,
  );
  // If next.ok: broadcast next.publicState; otherwise handle next.error.code.
}
```

Advancing to the next round is **explicit**, not a client action. It also increments `version` by `1`. The next round starts directly in `PLAYING / WAITING_FOR_DRAW`: **there is no new initial reveal phase**.

## 3. Public state and essential types

### 3.1 `PublicGameState` — data intended for participants

| Field | Meaning |
|---|---|
| `id`, `version` | State identifier and version; use **this** version for the next command. |
| `phase`, `turnStage`, `currentPlayerId` | Lifecycle phase, turn stage, and player authorized to act. |
| `players` | `{ id, board, totalScore }[]` in turn order; `totalScore` is **cumulative**. |
| `roundNumber`, `targetScore` | Round number (starts at `1`) and game-ending score threshold. |
| `deckCount`, `discardTop` | Number of cards remaining in the draw deck and value of the top discard card (`null` if empty). |
| `pendingCard` | `null` or `{ source: "DECK" | "DISCARD", value }`: card temporarily held by the current player. |
| `roundStarterId`, `roundFinisherId` | First player of the round and first player to finish their board; `null` when not yet determined. |
| `roundHistory` | History of **completed** rounds and their scores. |
| `winnerIds` | Array of winners at game end, potentially multiple in case of a tie; empty beforehand. |

Each `players[i].board` retains **12 positions**. Each public slot has one of these shapes:

```ts
{ status: "hidden" }                 // hidden value
{ status: "revealed", value: 5 }    // visible value (-2 to 12)
{ status: "removed" }                // removed column
```

The `pendingCard` value is **visible to all participants** in this public state, including when it comes from the draw deck: **this is not a player-specific view**. Hidden board values, card IDs, the order/contents of the draw deck, and the final-turn queue are not exposed.

### 3.2 Difference from the internal state

- `GameState` contains, among other things, `deck`, `discardPile`, `pendingCard` (the complete card), `pendingCardSource`, `finalTurnQueue`, and boards with hidden values. **Server-side only.**
- `buildPublicState(state)` constructs a `PublicGameState` without modifying the original; it **performs no authorization checks**. The manager verifies membership for `getPublicState()` and `submitAction()`.
- `roundHistory` contains `RoundResult` objects shaped like `{ roundNumber, starterId, finisherId, scores }`, with `scores: { playerId, baseScore, finalScore }[]`. `baseScore` is calculated before any penalty; `finalScore` is added to the cumulative total.

## 4. Errors and exceptions

Business-logic errors use **symbolic codes**, not HTTP status codes or messages intended to be displayed verbatim. A `{ ok: false, error: { code } }` response does not modify the stored game.

### 4.1 Manager error codes

| Code | Meaning |
|---|---|
| `GAME_ALREADY_EXISTS` | `create()`: this ID is already in use within the instance. |
| `INVALID_GAME_INPUT` | `create()`: malformed creation data (structure, IDs, player count, or target score). Input validation precedes the duplicate game ID check. |
| `GAME_UNAVAILABLE` | Game does not exist **or** the actor is not a participant (read/action); for `advanceRound`, the game is absent. Does not reveal whether a game exists to a non-participant. |
| `VERSION_CONFLICT` | `expectedVersion` differs from `state.version`; retrieve the updated state before acting. |
| `INVALID_ACTION_PAYLOAD` | Malformed payload or invalid version (not an integer or negative). Includes a client-supplied `playerId`, additional keys, a non-integer `position`, or an unknown action type. |
| `INVALID_GAME_PHASE` | `advanceRound()` called outside `ROUND_FINISHED`. |

### 4.2 Engine error codes (also propagated by the manager)

| Code | Meaning |
|---|---|
| `UNKNOWN_ACTION` | Unknown command type passed **directly to the engine**; through the manager, it is rejected as `INVALID_ACTION_PAYLOAD`. |
| `GAME_OVER` | Game action attempted on a finished game. |
| `PLAYER_NOT_FOUND` | `playerId` unknown to the engine; the manager normally checks membership beforehand. |
| `NOT_YOUR_TURN` | A participant other than `currentPlayerId` acts during `PLAYING`. |
| `ACTION_NOT_ALLOWED` | Command incompatible with the current phase/stage, or a player's third initial reveal. |
| `INVALID_POSITION` | Index outside `0..11`, or a removed slot targeted by a swap/reveal. |
| `CARD_NOT_HIDDEN` | Attempt to reveal an already revealed card. |

**Two validation layers:** The manager first validates membership, version, and the **shape** of the payload; the engine checks whether the action is legal. For example, `position: 1.5` produces `INVALID_ACTION_PAYLOAD`, while `position: 99` produces `INVALID_POSITION`. Checks are performed in a specific order: do not assume that a request containing multiple errors will always return the same code.

**Exceptions (`throw`):** These must be distinguished from business errors returned by the manager. `GameManager.create()` returns `INVALID_GAME_INPUT` for ordinary malformed creation inputs without calling the engine. Calling `createGame()` directly with invalid input still throws an explicit exception.

The engine may also throw when a `GameState` violates its invariants, when a random-number source is invalid, or when an internal operation cannot be completed. The manager does not convert these internal failures into business errors. Catch them at the HTTP/Socket boundary, log them on the server, and do not expose technical details to clients.

## 5. Rules and behaviors to know

- **Dealing:** 150 cards (`-2` ×5; `-1` ×10; `0` ×15; each value from `1` to `12` ×10). Each player receives 12 hidden cards; one card starts the discard pile. The draw deck is reshuffled at the start of each new round.
- **Starting player:** Once everyone has revealed two cards, the player with the **highest sum of those two cards** starts. Ties are broken randomly. In subsequent rounds, **the player who finished the previous round** starts.
- **Column:** Three vertically aligned **revealed, identical** cards are removed during a swap or reveal within a turn. Their slots become `removed`, count as zero, and their cards go to the discard pile. Additional columns may also be removed during end-of-round resolution, after all cards have been revealed.
- **End of round:** As soon as a player has no hidden cards left, they become `roundFinisherId`. **Every other player gets exactly one final turn**, in the normal turn order. Then: reveal the boards, remove completed columns, calculate scores, update cumulative totals and `roundHistory`.
- **Finisher penalty:** If the finisher's board score is **strictly positive** and at least one opponent has a board score **less than or equal to it**, the finisher's round score is **doubled**. A zero or negative score is never doubled. Other players' scores remain unchanged.
- **End of game:** After scoring a round, if **at least one** cumulative score reaches `targetScore`, the game enters `GAME_OVER`. The player or players with the **lowest total score** win (`winnerIds`).
- **Empty draw deck:** On the next `DRAW_DECK`, the engine shuffles the discard pile **while keeping its top card in place**; that card remains visible. If the discard pile contains fewer than two cards, it throws an invariant exception.

## 6. Direct game engine API

**Public entry point:** `game/index.ts`. Use it for trusted calls, tests, or orchestration that does not rely on the manager. Unlike the manager, the engine **does not verify authenticated identity, expected versions, or external access permissions**.

| Export | Signature / contract |
|---|---|
| `createGame` | `(input: CreateGameInput, random?: () => number): GameState` — creates the private state, `version = 0`, `INITIAL_REVEAL`; throws if creation input is invalid. |
| `applyAction` | `(oldState: GameState, command: GameCommand, random?: () => number): ApplyActionResult` — action with **`playerId` supplied by the trusted caller**; clones the state, then returns success or error. |
| `startNextRound` | `(oldState: GameState, random?: () => number): GameState` — requires `ROUND_FINISHED` and a coherent resolved state; clones, redeals, preserves cumulative totals and history, and increments `roundNumber` and `version`. |
| `buildPublicState` | `(state: GameState): PublicGameState` — constructs the public view, **without access control**. |
| Constants | `ACTION`, `PHASE`, `TURN_STAGE`, `ERROR_CODE` — string values exposed through `game/index.ts`. |
| Types | `GameCommand`, `GameState`, `CreateGameInput`, `ApplyActionResult`, `PublicGameState`, `RoundResult`, `RoundPlayerScore`, `GameId`, `PlayerId` (TypeScript types, not runtime values). |

```ts
type ApplyActionResult =
  | { ok: true; state: GameState; publicState: PublicGameState }
  | { ok: false; error: { code: ErrorCode } };

// In GameCommand, every action includes playerId.
// In ClientGameAction (GameManager), playerId is absent.
```

**Immutability:** `applyAction()` and `startNextRound()` operate on a deep copy (`structuredClone`) and do not modify their argument. A successful action returns a **new** `GameState`; the caller must retain it. Success increments `version` once, including when the action ends a round. A structured error leaves the original state unchanged.

### Utilities exported directly from their files

These are intended for tests and internal implementation, **not** for processing network commands directly. They are **not re-exported** by `game/index.ts`, except for `buildPublicState`.

| File | Exported functions and purpose |
|---|---|
| `createInputValidation.ts` | `getCreateGameInputError(input: unknown): string \| null`: internal validator shared by the engine and manager; returns `null` for valid input or a diagnostic message otherwise. |
| `deck.ts` | `createDeck(): Card[]` (150 cards); `shuffleDeck(deck: readonly Card[], random?: () => number): Card[]` (new array, Fisher–Yates); `takeTopCard(deck: Card[]): Card` (removes the last element, **mutates the array**, throws if empty). |
| `board.ts` | `isValidBoardPosition(position: number): boolean`; `getColumnPositions(position: number): readonly [number,number,number]`; `removeCompletedColumnAtPosition(player, position, discardPile): boolean` (**mutates arguments** if a column is removed); `revealAllCards(player): void`; `removeAllCompletedColumns(player, discardPile): void` (**mutate arguments**). |
| `turn.ts` | `hasHiddenCards(player): boolean`; `getNextPlayerId(players, currentPlayerId): PlayerId` (circular turn order); `buildFinalTurnQueue(players, finisherId): PlayerId[]` (all other players in that order). |
| `scoring.ts` | `calculateBoardScore(player): number` (revealed board, removed slots count as zero); `calculateFinisherScore(finisherBaseScore, otherBaseScores): number` (possible doubling); `buildRoundResult(players, roundNumber, starterId, finisherId): RoundResult` (calculates without modifying cumulative totals). |
| `stateMachine.ts` | `getAllowedActionTypes(state): ActionType[]` (actions allowed **globally**, without checking the player's identity). |
| `publicState.ts` | `buildPublicState(state): PublicGameState` (projection without authorization checks). |

Utility functions that manipulate internal state expect consistent data; some **modify their arguments** and may throw an exception instead of returning a structured error. `random` must return a real number in the interval `[0, 1)`.

## 7. Integration contract and tests

**Caller responsibilities:** Authenticate the player before calling the manager; associate their session with a trustworthy `userId`; determine which participants receive each `publicState`; handle duplicates/version conflicts and exceptions; invoke `advanceRound()` from server-side logic; and, where necessary, provide persistence, timeouts, disconnection handling, and coordination across multiple processes. These are **responsibility boundaries**, not statements about the application's development progress.

**Useful invariants:**

- A `GameManager` maintains the authoritative state. Do not reconstruct turns on the client side.
- A rejected action does not change the version; after success, use **the returned version**, including for a second sub-action within the same turn.
- Do not confuse `deckCount` with the total number of cards remaining: a pending card has been removed from its pile.
- `getAllowedActionTypes()` indicates which action types are valid for a phase/stage, **not** a player's permissions or which board slots can be targeted.
- Access to `getPublicState()` is restricted to participants; the internal `advanceRound()` call has no `userId`, so it must not be exposed directly as a client command.

**Verification from `srcs/backend/`:**

```bash
npm run game:check    # Type checking
npm run game:test     # Engine + GameManager tests
npm run game:verify   # Both
```

**Code references:** `game/index.ts`, `game/types.ts`, `game/constants.ts`, `game/engine.ts`, `game/publicState.ts`, `src/game/GameManager.ts`. Behavioral tests are located in `game/test/` and `src/game/test/`.
