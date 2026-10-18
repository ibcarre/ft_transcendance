import test from "node:test";
import assert from "node:assert/strict";

import {
    ACTION,
    PHASE,
    TURN_STAGE,
} from "../../../../game";

import type {
    PublicGameState,
} from "../../../../game";

import {
    GameManager,
} from "../GameManager";

import type {
    ManagerResult,
} from "../GameManager";

const GAME_ID = "game-42";
const ALICE = "user-11";
const BOB = "user-22";

function expectState(result: ManagerResult): PublicGameState {
	if (!result.ok) {
		throw new Error(`Unexpected manager error: ${result.error.code}`);
	}
	return result.publicState;
}

function expectCode(result: ManagerResult, code: string): void {
	assert.equal(result.ok, false);
	if (result.ok) {
		throw new Error("Expected a manager failure");
	}
	assert.equal(result.error.code, code);
}

function setup(): {	manager: GameManager, state: PublicGameState } {
	const manager = new GameManager(() => 0.5);
	const state = expectState(manager.create({ id: GAME_ID,
												players: [{ id: ALICE },
														  { id: BOB }],
												targetScore: 10_000 }));
	return { manager, state };
}

function act(manager: GameManager, state: PublicGameState, userId: string,
			 action: unknown): PublicGameState {
	return expectState(manager.submitAction(GAME_ID,
											userId,
											action,
											state.version));
}

function startPlaying(manager: GameManager, state: PublicGameState):
PublicGameState {
	for (const userId of [ALICE, BOB]) {
		state = act(manager, state, userId,
					{ type: ACTION.REVEAL_INITIAL_CARD, position: 0 });
		state = act(manager, state, userId,
					{ type: ACTION.REVEAL_INITIAL_CARD, position: 1 });
	}
	assert.equal(state.phase, PHASE.PLAYING);
	return state;
}

function finishRound(manager: GameManager, state: PublicGameState): PublicGameState {
	for (let attempts = 0; attempts < 200; attempts++) {
		if (state.phase !== PHASE.PLAYING) {
			assert.equal(state.phase, PHASE.ROUND_FINISHED);
			return state;
		}
		const userId = state.currentPlayerId;
		assert.ok(userId);
		if (state.turnStage === TURN_STAGE.WAITING_FOR_DRAW) {
			state = act(manager, state, userId, { type: ACTION.DRAW_DECK });
		}
		else if (state.turnStage === TURN_STAGE.DRAWN_FROM_DECK) {
			state = act(manager, state, userId,
						{ type: ACTION.DISCARD_DRAWN_CARD });
		}
		else if (state.turnStage === TURN_STAGE.MUST_REVEAL_CARD) {
			const player =
				state.players.find((candidate) => candidate.id === userId);
			assert.ok(player);
			const position =
				player.board.findIndex((slot) => slot.status === "hidden");
			assert.notEqual(position, -1);
			state = act(manager, state, userId,
						{ type: ACTION.REVEAL_CARD, position });
		}
		else {
			throw new Error(`Unexpected turn stage: ${state.turnStage}`);
		}
	}
	throw new Error("Round failed to finish within 200 commands");
}

test("create() registers an initial public state", () => {
	const { state } = setup();
	assert.equal(state.id, GAME_ID);
	assert.equal(state.version, 0);
	assert.equal(state.phase, PHASE.INITIAL_REVEAL);
	assert.equal(state.players.length, 2);
	assert.equal(state.deckCount, 125);
	assert.ok(state.players.every((player) =>
								  player.board.every((card) =>
													card.status === "hidden")));
});

test("create() refuses duplicate game IDs without replacing the original",
() => {
	const { manager, state } = setup();
	expectCode(manager.create({ id: GAME_ID,
							  players: [{ id: "other-1" },
										{ id: "other-2" }]}),
				"GAME_ALREADY_EXISTS");
	assert.deepEqual(expectState(manager.getPublicState(GAME_ID, ALICE)),
					 state);
});

test("unknown and nonparticipant game state can't be read", () => {
	const { manager } = setup();
	expectCode(manager.getPublicState("missing", ALICE), "GAME_UNAVAILABLE");
	expectCode(manager.getPublicState(GAME_ID, "stranger"), "GAME_UNAVAILABLE");
});

test("only a participant can submit a action", () => {
	const { manager, state } = setup();
	expectCode(manager.submitAction(GAME_ID, "stranger",
									{ type: ACTION.REVEAL_INITIAL_CARD,
										position: 0 },
									state.version), "GAME_UNAVAILABLE");
	assert.equal(expectState(manager.getPublicState(GAME_ID, ALICE)).version);
});

test("client-supplied playerId and unexpected keys are rejected", () => {
	const { manager, state } = setup();
	expectCode(manager.submitAction(GAME_ID, ALICE,
									{ type: ACTION.REVEAL_INITIAL_CARD,
										playerId: BOB, position: 0 },
									state.version), "INVALID_ACTION_PAYLOAD");
	expectCode(manager.submitAction(GAME_ID, ALICE,
									{ type: ACTION.DRAW_DECK, extra: "x" },
									state.version), "INVALID_ACTION_PAYLOAD");
	assert.equal(expectState(manager.getPublicState(GAME_ID, ALICE)).version,
				 0);
});

test("malformed payloads, positions and versions are safely rejected", () => {
	const { manager, state } = setup();
	for (const payload of [null,
							[],
							"DRAW_DECK",
							{},
							{ type: ACTION.REVEAL_INITIAL_CARD, position: "0" },
							{ type: ACTION.REVEAL_INITIAL_CARD, position: 1.5 },
							{ type: "SOMETHING_UNKNOWN" }]) {
		expectCode(manager.submitAction(GAME_ID, ALICE, payload, state.version),
				   "INVALID_ACTION_PAYLOAD");
	}
	for (const version of [-1, 0.5, NaN, Number.POSITIVE_INFINITY]) {
		expectCode(manager.submitAction(GAME_ID, ALICE,
										{ type: ACTION.REVEAL_INITIAL_CARD,
											position: 0 }, version),
					"INVALID_ACTION_PAYLOAD");
	}
	expectCode(manager.submitAction(GAME_ID, ALICE,
									{ type: ACTION.REVEAL_INITIAL_CARD,
										position: 99 }, state.version),
				"INVALID_POSITION");
	assert.equal(expectState(manager.getPublicState(GAME_ID, ALICE)).version,
				 0);
});

test("authenticated identity, not an untrusted command identity, determines \
the actor", () => {
	const { manager, state } = setup();
	const next = act(manager, state, ALICE,
					 { type: ACTION.REVEAL_INITIAL_CARD, position: 0 });
});
