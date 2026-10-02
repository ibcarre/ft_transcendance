import test from "node:test";
import assert from "node:assert/strict";

import {
	ACTION,
	CARD_SOURCE,
	ERROR_CODE,
	PHASE,
	TURN_STAGE,
} from "../constants";

import {
	applyAction,
	createGame,
} from "../index";

import type {
	ApplyActionResult,
	EngineSuccess,
	GameState,
} from "../types";

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

test("DRAW_DECK moves the top draw-pile card to pendingCard", () => {
	const state = createPlayingGame();
	const expectedCard = state.deck.at(-1);
	assert.ok(expectedCard);
	const previousDeckLength = state.deck.length;
	const previousDiscard = structuredClone(state.discardPile);
	const previousVersion = state.version;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.DRAW_DECK,
												 playerId: "user-1" }));
	assert.deepEqual(result.state.pendingCard, expectedCard);
	assert.equal(result.state.pendingCardSource, CARD_SOURCE.DECK);
	assert.equal(result.state.turnStage, TURN_STAGE.DRAWN_FROM_DECK);
	assert.equal(result.state.currentPlayerId, "user-1");
	assert.equal(result.state.deck.length, previousDeckLength - 1);
	assert.deepEqual(result.state.discardPile, previousDiscard);
	assert.equal(result.state.version, previousVersion + 1);
	assert.deepEqual(result.publicState.pendingCard,
					 { source: CARD_SOURCE.DECK, value: expectedCard.value });
	assert.equal(result.publicState.deckCount, previousDeckLength - 1);
});

test("DRAW_DECK doesn't mutate the previous GameState", () => {
	const state = createPlayingGame();
	const before = structuredClone(state);
	const result = applyAction(state,
								{ type: ACTION.DRAW_DECK, playerId: "user-1" });
	assert.equal(result.ok, true);
	assert.deepEqual(state, before);
});

test("DRAW_DECK doesn't use randomness when the draw pile is not empty", () => {
	const state = createPlayingGame();
	const randomMustNotBeCalled = (): number => {
		throw new Error("random() mustn't be called when the draw pile is not empty")
	};
	const result = applyAction(state,
							   { type: ACTION.DRAW_DECK, playerId: "user-1" },
							   randomMustNotBeCalled);
	assert.equal(result.ok, true);
});

test("DRAW_DISCARD moves the top discard card to pending Card", () => {
	const state = createPlayingGame();
	const expectedCard = state.discardPile.at(-1);
	assert.ok(expectedCard);
	const previousDeck = structuredClone(state.deck);
	const previousDiscardLength = state.discardPile.length;
	const previousVersion = state.version;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.DRAW_DISCARD,
												 playerId: "user-1" }));
	assert.deepEqual(result.state.pendingCard, expectedCard);
	assert.equal(result.state.pendingCardSource, CARD_SOURCE.DISCARD);
	assert.equal(result.state.turnStage, TURN_STAGE.MUST_SWAP_DISCARD);
	assert.equal(result.state.currentPlayerId, "user-1");
	assert.equal(result.state.discardPile.length, previousDiscardLength - 1);
	assert.deepEqual(result.state.deck, previousDeck);
	assert.equal(result.state.version, previousVersion + 1);
	assert.deepEqual(result.publicState.pendingCard,
					 { source: CARD_SOURCE.DISCARD,
						 value: expectedCard.value });
});

test("DRAW_DISCARD doesn't mutate the previous GameState", () => {
	const state = createPlayingGame();
	const before = structuredClone(state);
	const result = applyAction(state, { type: ACTION.DRAW_DISCARD, playerId: "user-1" });
	assert.equal(result.ok, true);
	assert.deepEqual(state, before);
});

for (const action of [ACTION.DRAW_DECK, ACTION.DRAW_DISCARD] as const) {
	test(`${action} rejects a known player who is not the current player`,
	() => {
		const state = createPlayingGame();
		const before = structuredClone(state);
		const result = applyAction(state, { type: action, playerId: "user-2" });
		expectError(result, ERROR_CODE.NOT_YOUR_TURN);
		assert.deepEqual(state, before);
	});

	test(`${action} rejects an unknown player`, () => {
		const state = createPlayingGame();
		const result = applyAction(state,
								   { type: action, playerId: "missing-user"});
		expectError(result, ERROR_CODE.PLAYER_NOT_FOUND);
	});

	test(`${action} is rejected outside PLAYING`, () => {
		const state = createGame(
			{ id: "game-test", players: [{ id: "user-1" }, { id: "user-2" }] },
			() => 0.5);
			const result = applyAction(state,
									   { type: action, playerId: "user-1" });
			expectError(result, ERROR_CODE.ACTION_NOT_ALLOWED);
	});

	test(`${action} returns GAME_OVER when the game is over`, () => {
		const state = createPlayingGame();
		state.phase = PHASE.GAME_OVER;
		state.turnStage = null;
		const result = applyAction(state, { type: action, playerId: "user-1" });
		expectError(result, ERROR_CODE.GAME_OVER);
	});
}

test("a player can't draw again after DRAW_DECK", () => {
	let state = createPlayingGame();
	state = expectSuccess(applyAction(state,
									  {	type: ACTION.DRAW_DECK,
										  playerId: "user-1" })).state;
	expectError(applyAction(state,
							{ type: ACTION.DRAW_DECK, playerId: "user-1" }),
				ERROR_CODE.ACTION_NOT_ALLOWED);
	expectError(applyAction(state,
							{ type: ACTION.DRAW_DISCARD, playerId: "user-1" }),
				ERROR_CODE.ACTION_NOT_ALLOWED);
});

test("a player can't draw again after DRAW_DISCARD", () => {
	let state = createPlayingGame();
	state = expectSuccess(applyAction(state,
									  {	type: ACTION.DRAW_DISCARD,
										  playerId: "user-1" })).state;
	expectError(applyAction(state,
							{ type: ACTION.DRAW_DECK, playerId: "user-1" }),
				ERROR_CODE.ACTION_NOT_ALLOWED);
	expectError(applyAction(state,
							{ type: ACTION.DRAW_DISCARD, playerId: "user-1" }),
				ERROR_CODE.ACTION_NOT_ALLOWED);
});

test("drawing rejects an inconsistent WAITING_FOR_DRAW state with a pending card", () => {
	const state = createPlayingGame();
	const card = state.deck.pop();
	assert.ok(card);
	state.pendingCard = card;
	state.pendingCardSource = CARD_SOURCE.DECK;
	assert.throws(() => applyAction(state,
									{ type: ACTION.DRAW_DECK,
										playerId: "user-1" }),
						{ message: "Invalid GameState: WAITING_FOR_DRAW \
requires no pending card"});
});

test("DRAW_DISCARD rejects an inconsistent empty discard pile", () => {
	const state = createPlayingGame();
	state.discardPile.length = 0;
	assert.throws(() => applyAction(state,
									{ type: ACTION.DRAW_DISCARD,
										playerId: "user-1" }),
						{ message:"Invalid GameState: can't draw from an empty \
discard pile" });
});

test("DRAW_DECK refills an empty draw pile while preserving the top discard", () => {
	const state = createPlayingGame();
	const topDiscard = state.discardPile.pop();
	assert.ok(topDiscard);
	const recyclableCards = [...state.deck];
	const recyclableIds = new Set(recyclableCards.map((card) => card.id));
	state.deck = [];
	state.discardPile = [...recyclableCards, topDiscard];
	const previousVersion = state.version;
	const result = expectSuccess(applyAction(state,
											 { type: ACTION.DRAW_DECK,
												 playerId: "user-1" },
								() => 0));

	assert.equal(result.state.discardPile.length, 1);
	assert.deepEqual(result.state.discardPile[0], topDiscard);
	assert.equal(result.state.deck.length, recyclableCards.length - 1);
	assert.equal(result.state.version, previousVersion + 1);
	assert.equal(result.state.pendingCardSource, CARD_SOURCE.DECK);
	assert.equal(result.state.turnStage, TURN_STAGE.DRAWN_FROM_DECK);
	assert.ok(result.state.pendingCard);
	assert.equal(recyclableIds.has(result.state.pendingCard.id), true);
	assert.notEqual(result.state.pendingCard.id, topDiscard.id);

	const remainingIds = new Set([...result.state.deck.map((card) => card.id),
								 result.state.pendingCard.id]);
	assert.equal(remainingIds.size, recyclableCards.length);
	for (const id of recyclableIds) {
		assert.equal(remainingIds.has(id), true);
	}
});

test("DRAW_DECK rejects an impossible empty draw pile that can't be refilled",
	 () => {
	const state = createPlayingGame();
	state.deck = [];
	assert.equal(state.discardPile.length, 1);
	assert.throws(() => applyAction(state,
									{ type: ACTION.DRAW_DECK,
										playerId: "user-1" }),
						{ message: "Invalid GameState: can't refill the draw \
pile from a too small discard pile" });
});
