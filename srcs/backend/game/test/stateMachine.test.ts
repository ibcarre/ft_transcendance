import test from "node:test";
import assert from "node:assert/strict";

import {
	ACTION,
	ERROR_CODE,
	PHASE
} from "../constants";

import {
	applyAction,
	createGame
} from "../index";

import {
	getAllowedActionTypes
} from "../stateMachine";

test("ROUND_FINISHED allows no player action", () => {
	const state = createGame({ id: "game-test",
							 players: [{ id: "user-1" }, { id: "user-2" }]});
	state.phase = PHASE.ROUND_FINISHED;
	assert.deepEqual(getAllowedActionTypes(state), []);
	const previous = structuredClone(state);
	const result = applyAction(state, { type: ACTION.REVEAL_INITIAL_CARD,
										playerId: "user-1",
										position: 0});
	assert.equal(result.ok, false);
	if (!result.ok) {
		assert.equal(result.error.code, ERROR_CODE.ACTION_NOT_ALLOWED);
	}
	assert.deepEqual(state, previous);
});

test("GAME_OVER aows no player action", () => {
	const state = createGame({ id: "game-test",
							 players: [{ id: "user-1" }, { id: "user-2" }]});
	state.phase = PHASE.GAME_OVER;;
	assert.deepEqual(getAllowedActionTypes(state), []);
});
