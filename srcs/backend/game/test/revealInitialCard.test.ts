import test from "node:test";
import assert from "node:assert/strict";

import {
	ACTION,
	ERROR_CODE,
	PHASE,
	TURN_STAGE,
} from "../constants";

import {
	applyAction,
	buildPublicState,
	createGame,
} from "../index";

import type {
	ApplyActionResult,
	CardValue,
	GameState,
	PlayerId,
} from "../types";





function createTestGame(playerIds: readonly PlayerId[] = ["user-1", "user-2"]):
	GameState {
	return createGame({ id: "game-test",
					  players: playerIds.map((id) => ({ id }))}, () => 0.5);
}

function setBoardCardValue(state: GameState, playerId: PlayerId,
						   position: number, value: CardValue): void {
	const player = state.players.find((candidate) => candidate.id === playerId);
	assert.ok(player);

	const slot = player.board[position];
	assert.ok(slot);
	slot.card.value = value;
}

function revealSuccessfully(state: GameState, playerId: PlayerId,
							position: number, random: () => number = () => 0):
	GameState {
	const result = applyAction(state,
							   { type: ACTION.REVEAL_INITIAL_CARD, playerId,
								   position },
								random);
	if (!result.ok) {
		throw new Error(`Expected REVEAL_INITIAL_CARD to succeed, \
got ${result.error.code}`);
	}
	assert.equal(result.ok, true);
	return result.state;
}

function expectError(result: ApplyActionResult, code: string): void {
	if (result.ok) {
		throw new Error("Expected action to fail");
	}
	assert.equal(result.ok, false);
	assert.equal(result.error.code, code);
}





test("REVEAL_INITIAL_CARD reveals exactly the requested hidden card", () => {
	const game = createTestGame();
	const player = game.players[0];
	assert.ok(player);

	const expectedValue = player.board[4]?.card.value;
	assert.notEqual(expectedValue, undefined);

	const result = applyAction(game, {
		type: ACTION.REVEAL_INITIAL_CARD,
		playerId: "user-1", position: 4 });
	assert.equal(result.ok, true);
	if (!result.ok) {
		return;
	}

	const updatedPlayer = result.state.players[0];
	assert.ok(updatedPlayer);
	assert.equal(updatedPlayer.board[4]?.revealed, true);
	assert.equal(updatedPlayer.board[3]?.revealed, false);
	assert.equal(updatedPlayer.board[5]?.revealed, false);

	const publicPlayer = result.publicState.players[0];
	assert.ok(publicPlayer);
	assert.deepEqual(publicPlayer.board[4],
					 {status: "revealed", value: expectedValue});
});

test("REVEAL_INITIAL_CARD doesn't mutate the previous GameState", () => {
	const game = createTestGame();
	const before = structuredClone(game);
	const result = applyAction(game, {
		type: ACTION.REVEAL_INITIAL_CARD,
		playerId: "user-1", position: 0 });
	assert.deepEqual(game, before);
	if (result.ok) {
		assert.notStrictEqual(result.state, game);
		assert.equal(result.state.players[0]?.board[0]?.revealed, true);
	}
});

test("REVEAL_INITIAL_CARD increments version exactly once on success", () => {
	const game = createTestGame();
	assert.equal(game.version, 0);

	const first = applyAction(game, {
		type: ACTION.REVEAL_INITIAL_CARD,
		playerId: "user-1", position: 0 });
	assert.equal(first.ok, true);

	if (!first.ok) {
		return;
	}
	assert.equal(first.state.version, 1);

	const second = applyAction(first.state, {
		type: ACTION.REVEAL_INITIAL_CARD,
		playerId: "user-1", position: 1 });
	assert.equal(second.ok, true);
	if (!second.ok) {
		return;
	}
	assert.equal(second.state.version, 2);
});

test("INITIAL_REVEAL remains active until every player has revealed exactly \
two cards and a starting player has been determined", () => {
	let state = createTestGame();
	state = revealSuccessfully(state, "user-2", 7);
	state = revealSuccessfully(state, "user-1", 2);
	state = revealSuccessfully(state, "user-2", 8);
	assert.equal(state.phase, PHASE.INITIAL_REVEAL);
	assert.equal(state.turnStage, null);
	assert.equal(state.currentPlayerId, null);
	assert.equal(state.version, 3);

	state = revealSuccessfully(state, "user-1", 3);
	assert.equal(state.phase, PHASE.PLAYING);
	assert.equal(state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
	assert.notEqual(state.currentPlayerId, null);
	assert.equal(state.version, 4);
});

test("REVEAL_INITIAL_CARD can be performed by players in any order during \
INITIAL_REVEAL", () => {
	let state = createTestGame(["user-1", "user-2", "user-3"]);
	state = revealSuccessfully(state, "user-3", 11);
	state = revealSuccessfully(state, "user-1", 0);
	state = revealSuccessfully(state, "user-2", 5);
	state = revealSuccessfully(state, "user-3", 10);
	state = revealSuccessfully(state, "user-2", 6);
	assert.equal(state.phase, PHASE.INITIAL_REVEAL);
	assert.equal(state.currentPlayerId, null);

	state = revealSuccessfully(state, "user-1", 1);
	assert.equal(state.phase, PHASE.PLAYING);

});

test("REVEAL_INITIAL_CARD rejects an unknown player", () => {
	const game = createTestGame();
	const before = structuredClone(game);
	const result = applyAction(game, { type: ACTION.REVEAL_INITIAL_CARD,
									playerId: "missing-user", position: 0 });
	expectError(result, ERROR_CODE.PLAYER_NOT_FOUND);
	assert.deepEqual(game, before);
});

for (const invalidPosition of [-1, 12, 1.5, Number.NaN]) {
	test(`REVEAL_INITIAL_CARD rejects invalid position ${String(invalidPosition)}`,
		 () => {
			const game = createTestGame();
			const result = applyAction(game,
									   { type: ACTION.REVEAL_INITIAL_CARD,
										playerId: "user-1",
										position: invalidPosition });
			expectError(result, ERROR_CODE.INVALID_POSITION);
			assert.equal(game.version, 0);
		 });
}

test("REVEAL_INITIAL_CARD rejects a card that is already revealed", () => {
	let state = createTestGame();
	state = revealSuccessfully(state, "user-1", 0);
	const before = structuredClone(state);
	const result = applyAction(state, { type: ACTION.REVEAL_INITIAL_CARD,
									playerId: "user-1", position: 0 });
	expectError(result, ERROR_CODE.CARD_NOT_HIDDEN);
	assert.deepEqual(state, before);
	assert.equal(state.version, 1);
});

test("REVEAL_INITIAL_CARD prevents a player from revealing a thrid initial \
card", () => {
	let state = createTestGame();
	state = revealSuccessfully(state, "user-1", 0);
	state = revealSuccessfully(state, "user-1", 1);

	const before = structuredClone(state);
	const result = applyAction(state, { type: ACTION.REVEAL_INITIAL_CARD,
										playerId: "user-1", position: 2 });
	expectError(result, ERROR_CODE.ACTION_NOT_ALLOWED);
	assert.deepEqual(state, before);
	assert.equal(state.version, 2);
});

test("REVEAL_INITIAL_CARD is rejected after INITIAL_REVEAL has finished", () => {
	let state = createTestGame();
	state = revealSuccessfully(state, "user-1", 0);
	state = revealSuccessfully(state, "user-1", 1);
	state = revealSuccessfully(state, "user-2", 0);
	state = revealSuccessfully(state, "user-2", 1);
	assert.equal(state.phase, PHASE.PLAYING);

	const result = applyAction(state,
							   { type: ACTION.REVEAL_INITIAL_CARD,
									playerId: "user-1",
									position: 2 });
	expectError(result, ERROR_CODE.ACTION_NOT_ALLOWED);
});

test("REVEAL_INITIAL_CARD returns GAME_OVER when the game is already over",
() => {
	const game = createTestGame();
	game.phase = PHASE.GAME_OVER;
	const result = applyAction(game,
							   { type: ACTION.REVEAL_INITIAL_CARD,
									playerId: "user-1",
									position: 0});
	expectError(result, ERROR_CODE.GAME_OVER);
});

test("the random() function is never called without a tie", () => {
	let state = createTestGame();
	setBoardCardValue(state, "user-1", 0, 12);
	setBoardCardValue(state, "user-1", 1, -2);
	setBoardCardValue(state, "user-2", 0, 4);
	setBoardCardValue(state, "user-2", 1, 2);
	state = revealSuccessfully(state, "user-1", 0);
	state = revealSuccessfully(state, "user-1", 1);
	state = revealSuccessfully(state, "user-2", 0);
	const randomMustNotBeCalled = (): number => {
		throw new Error("random() must not be called without a tie");
	}
	state = revealSuccessfully(state, "user-2", 1, randomMustNotBeCalled);
});

test("the player with the unique highest initial sum starts the first round", () => {
	let state = createTestGame();
	setBoardCardValue(state, "user-1", 0, 12);
	setBoardCardValue(state, "user-1", 1, -2);
	setBoardCardValue(state, "user-2", 0, 4);
	setBoardCardValue(state, "user-2", 1, 2);
	state = revealSuccessfully(state, "user-1", 0);
	state = revealSuccessfully(state, "user-1", 1);
	state = revealSuccessfully(state, "user-2", 0);
	const randomMustNotBeCalled = (): number => {
		throw new Error("random() must not be called without a tie");
	}
	state = revealSuccessfully(state, "user-2", 1, randomMustNotBeCalled);
	assert.equal(state.currentPlayerId, "user-1");
	assert.equal(state.phase, PHASE.PLAYING);
	assert.equal(state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
});

test("the highest initial sum is selected correctly when all sums are negative", () => {
	let state = createTestGame();
	setBoardCardValue(state, "user-1", 0, -2);
	setBoardCardValue(state, "user-1", 1, -2);
	setBoardCardValue(state, "user-2", 0, -2);
	setBoardCardValue(state, "user-2", 1, -1);
	state = revealSuccessfully(state, "user-1", 0);
	state = revealSuccessfully(state, "user-1", 1);
	state = revealSuccessfully(state, "user-2", 0);
	state = revealSuccessfully(state, "user-2", 1);
	assert.equal(state.currentPlayerId, "user-2");
});

test("an initial sum tie is resolved randomly among the tied highest players", () => {
	let state = createTestGame(["user-1", "user-2", "user-3"]);
	setBoardCardValue(state, "user-1", 0, 12);
	setBoardCardValue(state, "user-1", 1, -2);
	setBoardCardValue(state, "user-2", 0, 4);
	setBoardCardValue(state, "user-2", 1, 2);
	setBoardCardValue(state, "user-3", 0, 5);
	setBoardCardValue(state, "user-3", 1, 5);
	state = revealSuccessfully(state, "user-1", 0);
	state = revealSuccessfully(state, "user-1", 1);
	state = revealSuccessfully(state, "user-2", 0);
	state = revealSuccessfully(state, "user-2", 1);
	state = revealSuccessfully(state, "user-3", 0);
	let randomCallCount = 0;
	const chooseSecondTiedPlayer = (): number => {
		randomCallCount++;
		return 0.5;
	};
	state = revealSuccessfully(state, "user-3", 1, chooseSecondTiedPlayer);
	assert.equal(randomCallCount, 1);
	assert.equal(state.currentPlayerId, "user-3");
	assert.notEqual(state.currentPlayerId, "user-2");
});

test("the same tie-break random value produces the same initial starting player", () => {
	function createTiedGame(): GameState {
		const game = createTestGame(["user-1", "user-2"]);
		setBoardCardValue(game, "user-1", 0, 4);
		setBoardCardValue(game, "user-1", 1, 2);
		setBoardCardValue(game, "user-2", 0, 3);
		setBoardCardValue(game, "user-2", 1, 3);
		return game;
	}

	function finishInitialReveal(game: GameState): GameState {
		let state = game;
		state = revealSuccessfully(state, "user-1", 0);
		state = revealSuccessfully(state, "user-1", 1);
		state = revealSuccessfully(state, "user-2", 0);
		state = revealSuccessfully(state, "user-2", 1, () => 0.75);
		return state;
	}

	const first = finishInitialReveal(createTiedGame());
	const second = finishInitialReveal(createTiedGame());
	assert.equal(first.currentPlayerId, "user-2");
	assert.equal(second.currentPlayerId, "user-2");
});

test("the successful final reveal returns a PublicGameState matching the transitioned GameState", () => {
	let state = createTestGame();
	state = revealSuccessfully(state, "user-1", 0);
	state = revealSuccessfully(state, "user-1", 1);
	state = revealSuccessfully(state, "user-2", 0);
	const result = applyAction(state, 
							   { type: ACTION.REVEAL_INITIAL_CARD, 
								   playerId: "user-2", 
								   position: 1 },
								() => 0);
	assert.equal(result.ok, true);
	if (!result.ok) {
		return;
	}
	assert.deepEqual(result.publicState, buildPublicState(result.state));
});
