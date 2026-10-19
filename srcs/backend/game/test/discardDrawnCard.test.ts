import test from "node:test";
import assert from "node:assert/strict";

import type {
	ApplyActionResult,
	EngineSuccess,
	GameState,
} from "../types";

import {
	applyAction,
	createGame,
} from "../index";

import {
	ACTION,
	CARD_SOURCE,
	ERROR_CODE,
	PHASE,
	TURN_STAGE,
} from "../constants";





function createPlayingGame(): GameState {
	let state = createGame({ id: "game-test",
						   players: [{ id: "user-1" },
									{ id: "user-2" }]}, () => 0.5);
	const user1 = state.players.find((player) => player.id === "user-1");
	const user2 = state.players.find((player) => player.id === "user-2");
	assert.ok(user1);
	assert.ok(user2);
	assert.ok(user1.board[0]);
	assert.ok(user1.board[1]);
	assert.ok(user2.board[0]);
	assert.ok(user2.board[1]);

	/*
	 * Force a unique initial winner so 'user-1' always becomes currentPlayerId
	*/
   user1.board[0].card.value = 12;
   user1.board[1].card.value = 12;
   user2.board[0].card.value = -2;
   user2.board[1].card.value = -2;
   state = revealSuccessfully(state, "user-1", 0);
   state = revealSuccessfully(state, "user-1", 1);
   state = revealSuccessfully(state, "user-2", 0);
   state = revealSuccessfully(state, "user-2", 1);
   assert.equal(state.phase, PHASE.PLAYING);
   assert.equal(state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
   assert.equal(state.currentPlayerId, "user-1");
   assert.equal(state.pendingCard, null);
   assert.equal(state.pendingCardSource, null);
   return state;
}

function expectSuccess(result: ApplyActionResult): EngineSuccess {
	if (!result.ok) {
		throw new Error(`Expected success, got ${result.error.code}`);
	}
	assert.equal(result.ok, true);
	return result;
}

function expectError(result: ApplyActionResult, code: string): void {
	assert.equal(result.ok, false);
	if (result.ok) {
		throw new Error("Expected action to fail");
	}
	assert.equal(result.error.code, code);
}

function revealSuccessfully(state: GameState, playerId: string,
							position: number): GameState {
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.REVEAL_INITIAL_CARD,
												playerId, position }));
	return result.state;
}

function drawFromDeck(state: GameState): GameState {
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.DRAW_DECK,
													playerId: "user-1" }));
	return result.state;
}

test("DISCARD_DRAWN_CARD moves the pending deck card to the discard pile",
	() => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const pendingCard = state.pendingCard;
	assert.ok(pendingCard);
	const previousDiscardLength = state.discardPile.length;
	const previousVersion = state.version;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.DISCARD_DRAWN_CARD,
												playerId: "user-1" }));
	assert.equal(result.state.discardPile.length, previousDiscardLength + 1);
	assert.deepEqual(result.state.discardPile.at(-1), pendingCard);
	assert.equal(result.state.pendingCard, null);
	assert.equal(result.state.pendingCardSource, null);
	assert.equal(result.state.turnStage, TURN_STAGE.MUST_REVEAL_CARD);
	assert.equal(result.state.currentPlayerId, "user-1");
	assert.equal(result.state.version, previousVersion + 1);
	assert.equal(result.publicState.discardTop, pendingCard.value);
	assert.equal(result.publicState.pendingCard, null);
});

test("DISCARD_DRAWN_CARD is rejected after drawing from the discard pile",
	() => {
	let state = createPlayingGame();
	state = expectSuccess(applyAction(state,
									  { type: ACTION.DRAW_DISCARD,
											playerId: "user-1" })).state;
	const result = applyAction(state,
							   { type: ACTION.DISCARD_DRAWN_CARD,
									playerId: "user-1" });
	expectError(result, ERROR_CODE.ACTION_NOT_ALLOWED);
});

test("DISCARD_DRAWN_CARD rejects an inconsistent player with no hidden card \
to reveal", () => {
	let state = createPlayingGame();
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	for (const slot of player.board) {
		if (slot !== null) {
			slot.revealed = true;
		}
	}
	state = drawFromDeck(state);
	assert.throws(() =>
		applyAction(state,
					{ type: ACTION.DISCARD_DRAWN_CARD, playerId: "user-1" }),
					{ message: "Invalid GameState: DISCARD_DRAWN_CARD \
requires a hidden card to reveal" });
});

test("after DISCARD_DRAWN_CARD, the player must reveal a card before any new \
draw", () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	state = expectSuccess(applyAction(state,
									  { type: ACTION.DISCARD_DRAWN_CARD,
											playerId: "user-1" })).state;
	expectError(applyAction(state,
							{ type: ACTION.DRAW_DISCARD, playerId: "user-1" }),
							ERROR_CODE.ACTION_NOT_ALLOWED);
	expectError(applyAction(state,
							{ type: ACTION.SWAP_CARD,
								playerId: "user-1",
								position: 2 }),	ERROR_CODE.ACTION_NOT_ALLOWED);
	expectError(applyAction(state,
							{ type: ACTION.DRAW_DECK, playerId: "user-1" }),
							ERROR_CODE.ACTION_NOT_ALLOWED);
});











test("DISCARD_DRAWN_CARD doesn't mutate the previous GameState", () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const before = structuredClone(state);
	const result = applyAction(state,
							   { type: ACTION.DISCARD_DRAWN_CARD,
								 playerId: "user-1" });
	assert.equal(result.ok, true);
	assert.deepEqual(state, before);
});

test("DISCARD_DRAWN_CARD is rejected while waiting for a draw", () => {
	const state = createPlayingGame();
	const result = applyAction(state,
							   { type: ACTION.DISCARD_DRAWN_CARD,
								 playerId: "user-1" });
	expectError(result, ERROR_CODE.ACTION_NOT_ALLOWED);
});

test("DISCARD_DRAWN_CARD rejects a player who isn't the current player",
	() => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const result = applyAction(state,
							   { type: ACTION.DISCARD_DRAWN_CARD,
								 playerId: "user-2" });
	expectError(result, ERROR_CODE.NOT_YOUR_TURN);
});

test("DISCARD_DRAWN_CARD rejects an unknown player", () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const result = applyAction(state,
							   { type: ACTION.DISCARD_DRAWN_CARD,
								 playerId: "missing-user" });
	expectError(result, ERROR_CODE.PLAYER_NOT_FOUND);
});

test("DISCARD_DRAWN_CARD rejects an inconsistent state without a pending card",
	() => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	state.pendingCard = null;
	state.pendingCardSource = null;
	assert.throws(() =>
		applyAction(state,
					{ type: ACTION.DISCARD_DRAWN_CARD, playerId: "user-1" }),
					{ message: "Invalid GameState: DISCARD_DRAWN_CARD requires \
a pending card" });
});

test("DISCARD_DRAWN_CARD rejects an inconsistent pending card source", () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	state.pendingCardSource = CARD_SOURCE.DISCARD;
	assert.throws(() =>
		applyAction(state,
					{ type: ACTION.DISCARD_DRAWN_CARD, playerId: "user-1" }),
					{ message: "Invalid GameState: DISCARD_DRAWN_CARD requires \
a pending deck card" });
});
