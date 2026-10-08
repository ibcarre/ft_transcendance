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

function reachMustRevealCard(state: GameState): GameState {
	state = expectSuccess(applyAction(state,
									  { type: ACTION.DRAW_DECK,
											playerId: "user-1" })).state;
	state = expectSuccess(applyAction(state,
									  { type: ACTION.DISCARD_DRAWN_CARD,
											playerId: "user-1" })).state;
	assert.equal(state.turnStage, TURN_STAGE.MUST_REVEAL_CARD);
	return state;
}

test("REVEAL_CARD reveals the selected hidden card in place and completes the \
turn", () => {
	let state = createPlayingGame();
	state = reachMustRevealCard(state);
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	const slot = player.board[2];
	assert.ok(slot);
	assert.equal(slot.revealed, false);
	const revealedCard = structuredClone(slot.card);
	const previousVersion = state.version;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.REVEAL_CARD,
												playerId: "user-1",
												position: 2 }));
	const updatedPlayer =
		result.state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(updatedPlayer);
	assert.deepEqual(updatedPlayer.board[2],
					{ card: revealedCard, revealed: true });
	assert.equal(result.state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
	assert.equal(result.state.currentPlayerId, "user-2");
	assert.equal(result.state.pendingCard, null);
	assert.equal(result.state.pendingCardSource, null);
	assert.equal(result.state.version, previousVersion + 1);
	const publicSlot = result.publicState.players[0]?.board[2];
	assert.deepEqual(publicSlot,
					 { status: "revealed", value: revealedCard.value });
});

test("REVEAL_CARD rejects a card that is already revealed", () => {
	let state = createPlayingGame();
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	const slot = player.board[2];
	assert.ok(slot);
	slot.revealed = true;
	state = reachMustRevealCard(state);
	const result = applyAction(state,
							   { type: ACTION.REVEAL_CARD,
									playerId: "user-1",
									position: 2 });
	expectError(result, ERROR_CODE.CARD_NOT_HIDDEN);
});

test("REVEAL_CARD removes a completed column created by the reveal", () => {
	let state = createPlayingGame();
	state = reachMustRevealCard(state);
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	
	const topSlot = player.board[2];
	const middleSlot = player.board[6];
	const bottomSlot = player.board[10];
	assert.ok(topSlot);
	assert.ok(middleSlot);
	assert.ok(bottomSlot);
	topSlot.card.value = 7;
	topSlot.revealed = false;
	middleSlot.card.value = 7;
	middleSlot.revealed = true;
	bottomSlot.card.value = 7;
	bottomSlot.revealed = true;

	const discardLengthBefore = state.discardPile.length;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.REVEAL_CARD,
													playerId: "user-1",
													position: 2 }));
	const updatedPlayer =
		result.state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(updatedPlayer);
	assert.equal(updatedPlayer.board[2], null);
	assert.equal(updatedPlayer.board[6], null);
	assert.equal(updatedPlayer.board[10], null);
	assert.equal(result.state.discardPile.length, discardLengthBefore + 3);
	const addedCards = result.state.discardPile.slice(discardLengthBefore);
	assert.deepEqual(addedCards.map((card) => card.value), [7, 7, 7]);
});

test("REVEAL_CARD starts the final-turn sequence when the revealed card was \
the last hidden card", () => {
	let state = createPlayingGame();
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	for (const slot of player.board) {
		if (slot !== null) {
			slot.revealed = true;
		}
	}
	const target = player.board[2];
	assert.ok(target);
	target.revealed = false;
	state = reachMustRevealCard(state);
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.REVEAL_CARD,
												playerId: "user-1",
												position: 2 }));
	assert.equal(result.state.roundFinisherId, "user-1");
	assert.deepEqual(result.state.finalTurnQueue, ["user-2"]);
	assert.equal(result.state.currentPlayerId, "user-2");
	assert.equal(result.state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
});




test("REVEAL_CARD doesn't mutate the previous GameState", () => {
	let state = createPlayingGame();
	state = reachMustRevealCard(state);
	const before = structuredClone(state);
	const result = applyAction(state,
							   { type: ACTION.REVEAL_CARD,
								 playerId: "user-1",
								 position: 2 });
	assert.equal(result.ok, true);
	assert.deepEqual(state, before);
});

for (const position of [-1, 12, 1.5, Number.NaN]) {
	test(`REVEAL_CARD rejects invalid position ${String(position)}`, () => {
		let state = createPlayingGame();
		state = reachMustRevealCard(state);
		const result = applyAction(state,
								   { type: ACTION.REVEAL_CARD,
									 playerId: "user-1",
									 position });
		expectError(result, ERROR_CODE.INVALID_POSITION);
	});
}

test("REVEAL_CARD rejects an already removed board position", () => {
	let state = createPlayingGame();
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	player.board[2] = null;
	state = reachMustRevealCard(state);
	const result = applyAction(state,
							   { type: ACTION.REVEAL_CARD,
								 playerId: "user-1",
								 position: 2 });
	expectError(result, ERROR_CODE.INVALID_POSITION);
});

test("REVEAL_CARD is rejected while waiting for a draw", () => {
	const state = createPlayingGame();
	const result = applyAction(state,
							   { type: ACTION.REVEAL_CARD,
								 playerId: "user-1",
								 position: 2 });
	expectError(result, ERROR_CODE.ACTION_NOT_ALLOWED);
});

test("REVEAL_CARD rejects a player who isn't the current player", () => {
	let state = createPlayingGame();
	state = reachMustRevealCard(state);
	const result = applyAction(state,
							   { type: ACTION.REVEAL_CARD,
								 playerId: "user-2",
								 position: 2 });
	expectError(result, ERROR_CODE.NOT_YOUR_TURN);
});

test("REVEAL_CARD rejects an unknown player", () => {
	let state = createPlayingGame();
	state = reachMustRevealCard(state);
	const result = applyAction(state,
							   { type: ACTION.REVEAL_CARD,
								 playerId: "missing-user",
								 position: 2 });
	expectError(result, ERROR_CODE.PLAYER_NOT_FOUND);
});

test("REVEAL_CARD rejects an inconsistent state with a pending card", () => {
	let state = createPlayingGame();
	state = reachMustRevealCard(state);
	const pendingCard = state.deck.pop();
	assert.ok(pendingCard);
	state.pendingCard = pendingCard;
	state.pendingCardSource = CARD_SOURCE.DECK;
	assert.throws(() =>
		applyAction(state,
					{ type: ACTION.REVEAL_CARD,
					  playerId: "user-1",
					  position: 2 }),
					{ message: "Invalid GameState: MUST_REVEAL_CARD requires \
no pending card" });
});
