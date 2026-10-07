import test from "node:test";
import assert from "node:assert/strict";

import type {
	ApplyActionResult,
	EngineSuccess,
	GameState,
	PlayerId,
} from "../types";

import {
	ACTION,
	ERROR_CODE,
	PHASE,
	TURN_STAGE,
} from "../constants";


import {
	applyAction,
	createGame,
} from "../index";


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

function expectSuccess(result: ApplyActionResult): EngineSuccess {
	if (!result.ok) {
		throw new Error(`Expected success, got ${result.error.code}`);
	}
	assert.equal(result.ok, true);
	return result;
}

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

function drawFromDeck(state: GameState): GameState {
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.DRAW_DECK,
													playerId: "user-1" }));
	return result.state;
}

function drawFromDiscard(state: GameState): GameState {
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.DRAW_DISCARD,
													playerId: "user-1" }));
	return result.state;
}

test("SWAP_CARD exchanges a deck pending card with the selected tableau card",
	 () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);

	/*
	 * Ensures that the 3 cards in the tested column are all different,
     * prevents the column from being deleted
	*/
	const topSlot = player.board[2];
	const middleSlot = player.board[6];
	const bottomSlot = player.board[10];
	assert.ok(topSlot);
	assert.ok(middleSlot);
	assert.ok(bottomSlot);
	topSlot.card.value = 1;
	middleSlot.card.value = 2;
	bottomSlot.card.value = 3;

	const targetSlot = player.board[2];
	assert.ok(targetSlot);
	const pendingCard = state.pendingCard;
	assert.ok(pendingCard);
	const replacedCard = targetSlot.card;
	const previousVersion = state.version;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.SWAP_CARD,
												playerId: "user-1",
												position: 2 }));
	const updatedPlayer = result.state.players.find((candidate) => 
													candidate.id === "user-1");
	assert.ok(updatedPlayer);
	assert.deepEqual(updatedPlayer.board[2],
					 { card: pendingCard, revealed: true });
	assert.deepEqual(result.state.discardPile.at(-1), replacedCard);
	assert.equal(result.state.pendingCard, null);
	assert.equal(result.state.pendingCardSource, null);
	assert.equal(result.state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
	assert.equal(result.state.currentPlayerId, "user-2");
	assert.equal(result.state.version, previousVersion + 1);
});

test("SWAP_CARD exchanges a discard pending card with the selected tableau \
card", () => {
	let state = createPlayingGame();
	state = drawFromDiscard(state);
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);

	/*
	 * Ensures that the 3 cards in the tested column are all different,
     * prevents the column from being deleted
	*/
	const topSlot = player.board[2];
	const middleSlot = player.board[6];
	const bottomSlot = player.board[10];
	assert.ok(topSlot);
	assert.ok(middleSlot);
	assert.ok(bottomSlot);
	topSlot.card.value = 1;
	middleSlot.card.value = 2;
	bottomSlot.card.value = 3;

	const targetSlot = player.board[2];
	assert.ok(targetSlot);
	const pendingCard = state.pendingCard;
	assert.ok(pendingCard);
	const replacedCard = targetSlot.card;
	const previousVersion = state.version;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.SWAP_CARD,
												playerId: "user-1",
												position: 2 }));
	const updatedPlayer = result.state.players.find((candidate) => 
													candidate.id === "user-1");
	assert.ok(updatedPlayer);
	assert.deepEqual(updatedPlayer.board[2],
					 { card: pendingCard, revealed: true });
	assert.deepEqual(result.state.discardPile.at(-1), replacedCard);
	assert.equal(result.state.pendingCard, null);
	assert.equal(result.state.pendingCardSource, null);
	assert.equal(result.state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
	assert.equal(result.state.currentPlayerId, "user-2");
	assert.equal(result.state.version, previousVersion + 1);
});

test("SWAP_CARD can replace a hidden tableau card", () => {
	let state = createPlayingGame();
	const originalPlayer  =
		state.players.find((player) => player.id === "user-1");
	assert.ok(originalPlayer);
	const target = originalPlayer.board[4];
	assert.ok(target);
	target.revealed = false;
	state = drawFromDeck(state);
	const pendingCard = state.pendingCard;
	assert.ok(pendingCard);
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.SWAP_CARD,
												playerId: "user-1",
												position: 4 }));
	const updatedPlayer =
		result.state.players.find((player) => player.id === "user-1");
	assert.ok(updatedPlayer);
	assert.deepEqual(updatedPlayer.board[4],
					 { card: pendingCard, revealed: true });
});

test("SWAP_CARD can replace a revealed tableau card", () => {
	let state = createPlayingGame();
	const originalPlayer  =
		state.players.find((player) => player.id === "user-1");
	assert.ok(originalPlayer);
	const target = originalPlayer.board[4];
	assert.ok(target);
	target.revealed = true;
	state = drawFromDeck(state);
	const pendingCard = state.pendingCard;
	assert.ok(pendingCard);
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.SWAP_CARD,
												playerId: "user-1",
												position: 4 }));
	const updatedPlayer =
		result.state.players.find((player) => player.id === "user-1");
	assert.ok(updatedPlayer);
	assert.deepEqual(updatedPlayer.board[4],
					 { card: pendingCard, revealed: true });
});

test("SWAP_CARD rejects an already removed board position", () => {
	let state = createPlayingGame();
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	player.board[4] = null;
	state = drawFromDeck(state);
	const before = structuredClone(state);
	const result = applyAction(state,
							   { type: ACTION.SWAP_CARD,
									playerId: "user-1",
									position: 4 });
	assert.equal(result.ok, false);
	if (!result.ok) {
		assert.equal(result.error.code, ERROR_CODE.INVALID_POSITION);
	}
	assert.deepEqual(state, before);
});

for (const position of [-1, 12, 1.5, Number.NaN]) {
	test(`SWAP_CARD rejects invalid position ${String(position)}`, () => {
		let state = createPlayingGame();
		state = drawFromDeck(state);
		const result = applyAction(state,
								   { type: ACTION.SWAP_CARD,
										playerId: "user-1",
										position });
		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.equal(result.error.code, ERROR_CODE.INVALID_POSITION);
		}
	});
}

test("SWAP_CARD is rejected while waiting for a draw", () => {
	const state = createPlayingGame();
	const result = applyAction(state,
							   { type: ACTION.SWAP_CARD,
									playerId: "user-1",
									position: 0 });
	assert.equal(result.ok, false);
	if (!result.ok) {
		assert.equal(result.error.code, ERROR_CODE.ACTION_NOT_ALLOWED);
	}
});

test("SWAP_CARD rejects a player who isn't the current player", () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const result = applyAction(state,
							   { type: ACTION.SWAP_CARD,
									playerId: "user-2",
									position: 0 });
	assert.equal(result.ok, false);
	if (!result.ok) {
		assert.equal(result.error.code, ERROR_CODE.NOT_YOUR_TURN);
	}
});

test("SWAP_CARD removes a completed column after the exchange", () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	const pendingCard = state.pendingCard;
	assert.ok(pendingCard);
	const targetSlot = player.board[1];
	const middleSlot = player.board[5];
	const bottomSlot = player.board[9];
	assert.ok(targetSlot);
	assert.ok(middleSlot);
	assert.ok(bottomSlot);
	pendingCard.value = 7;
	middleSlot.card.value = 7;
	middleSlot.revealed = true;
	bottomSlot.card.value = 7;
	bottomSlot.revealed = true;
	targetSlot.card.value = 3;
	const replacedCardId = targetSlot.card.id;
	const discardLengthBefore = state.discardPile.length;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.SWAP_CARD,
												playerId: "user-1",
												position: 1 }));
	const updatedPlayer =
		result.state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(updatedPlayer);
	assert.equal(updatedPlayer.board[1], null);
	assert.equal(updatedPlayer.board[5], null);
	assert.equal(updatedPlayer.board[9], null);
	assert.equal(result.state.discardPile.length, discardLengthBefore + 4);
	const addedCards = result.state.discardPile.slice(discardLengthBefore);
	assert.equal(addedCards[0]?.id, replacedCardId);
	assert.deepEqual(addedCards.slice(1).map((card) => card.value), [7, 7, 7]);
});

test("SWAP_CARD starts the final-turn sequence when the current player \
becomes the finisher", () => {
	let state = createPlayingGame();
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	for (const slot of player.board) {
		if (slot !== null) {
			slot.revealed = true;
		}
	}
	const target = player.board[4]; assert.ok(target);
	target.revealed = false;
	state = drawFromDeck(state);
	const result = expectSuccess(applyAction(state,
											 {type: ACTION.SWAP_CARD,
												playerId: "user-1",
												position: 4 }));
	assert.equal(result.state.roundFinisherId, "user-1");
	assert.deepEqual(result.state.finalTurnQueue, ["user-2"]);
	assert.equal(result.state.currentPlayerId, "user-2");
	assert.equal(result.state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
});

test("SWAP_CARD doesn't mutate the previous GameState", () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const before = structuredClone(state);
	const result = applyAction(state,
							   { type: ACTION.SWAP_CARD,
									playerId: "user-1",
									position: 3 });
	assert.equal(result.ok, true);
	assert.deepEqual(state, before);
});

test("SWAP_CARD increments the game version exactly once", () => {
	let state = createPlayingGame();
	state = drawFromDeck(state);
	const previousVersion = state.version;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.SWAP_CARD,
												playerId: "user-1",
												position: 3 }));
	assert.equal(result.state.version, previousVersion + 1);
});
