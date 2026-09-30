import test from "node:test";
import assert from "node:assert/strict";

import {
    CARD_SOURCE,
    PHASE,
} from "../constants";

import {
    buildPublicState,
    createGame,
} from "../index";

import type {
    GameState,
} from "../types";

function createTestGame(): GameState {
	return createGame(
		{
			id: "game-test",
			players: [{ id: "user-1"}, { id: "user-2" }],
		},
		() => 0.5);
}

test("buildPublicState() exposes the expected initial public state", () => {
	const game = createTestGame();
	const publicState = buildPublicState(game);

	assert.equal(publicState.id, game.id);
	assert.equal(publicState.phase, PHASE.INITIAL_REVEAL);
	assert.equal(publicState.turnStage, null);
	assert.equal(publicState.currentPlayerId, null);
	assert.equal(publicState.roundNumber, 1);
	assert.equal(publicState.deckCount, game.deck.length);
	assert.equal(publicState.discardTop, game.discardPile.at(-1)?.value ?? null);
	assert.equal(publicState.pendingCard, null);
	assert.equal(publicState.version, 0);
	assert.deepEqual(
		publicState.players.map((player) => player.id),
        ["user-1", "user-2"]
	);
	for (const player of publicState.players) {
        assert.equal(player.totalScore, 0);
		assert.equal(player.board.length, 12);
		for (const slot of player.board) {
			assert.deepEqual(slot, { status: "hidden" });
		}
	}
});

test("buildPublicState() never exposes hidden board card values or internal \
card IDs", () => {
	const game = createTestGame();
	const publicState = buildPublicState(game);

	for (const player of publicState.players) {
		for (const slot of player.board) {
			assert.equal(Object.hasOwn(slot, "value"), false);
			assert.equal(Object.hasOwn(slot, "card"), false);
			assert.equal(Object.hasOwn(slot, "id"), false);
		}
    }
});

test("buildPublicState() exposes revealed board card values", () => {
	const game = createTestGame();
	const player = game.players[0];
	assert.ok(player);

	const slot = player.board[1];
	assert.ok(slot);
	slot.revealed = true;

	const expectedValue = slot.card.value;
	const publicState = buildPublicState(game);
	const publicPlayer = publicState.players[0];
	assert.ok(publicPlayer);
	assert.deepEqual(
		publicPlayer.board[1],
		{ status: "revealed", value: expectedValue }
	);
});

test("buildPublicState() represents removed board positions without exposing \
a card", () => {
	const game = createTestGame();
	const player = game.players[0];
	assert.ok(player);

	const slot = player.board[2];
	assert.ok(slot);

	game.discardPile.push(slot.card);
	player.board[2] = null;

	const publicState = buildPublicState(game);
	const publicPlayer = publicState.players[0];
	assert.ok(publicPlayer);
	assert.deepEqual(publicPlayer.board[2], { status: "removed" });
});

test("buildPublicState() publicly exposes a pending card drawn from the draw \
pile", () => {
	const game = createTestGame();
	const pendingCard = game.deck.pop();
	assert.ok(pendingCard);

	game.pendingCard = pendingCard;
	game.pendingCardSource = CARD_SOURCE.DECK;
	const publicState = buildPublicState(game);
	assert.deepEqual(
		publicState.pendingCard,
		{ source: CARD_SOURCE.DECK, value: pendingCard.value });
});

test("buildPublicState() publicly exposes a pending card taken from the \
discard pile", () => {
	const game = createTestGame();
	const pendingCard = game.discardPile.pop();
	assert.ok(pendingCard);

	game.pendingCard = pendingCard;
	game.pendingCardSource = CARD_SOURCE.DISCARD;
	const publicState = buildPublicState(game);
	assert.deepEqual(
		publicState.pendingCard,
		{ source: CARD_SOURCE.DISCARD, value: pendingCard.value }
	);
});

test("buildPublicState() preserves a visible card value of zero", () => {
	const game = createTestGame();

	game.discardPile.push({ id: 999, value: 0 });

	const publicState = buildPublicState(game);
	assert.equal(publicState.discardTop, 0);
});

test("buildPublicState() returns a null discard top when the discard pile is \
empty", () => {
	const game = createTestGame();

	game.discardPile.length = 0;
	const publicState = buildPublicState(game);
	assert.equal(publicState.discardTop, null);
	
});

test("buildPublicState() doesn't expose private GameState informations", () => {
	const publicState = buildPublicState(createTestGame());

	assert.equal(Object.hasOwn(publicState, "deck"), false);
	assert.equal(Object.hasOwn(publicState, "discardPile"), false);
	assert.equal(Object.hasOwn(publicState, "pendingCardSource"), false);
	assert.equal(Object.hasOwn(publicState, "roundFinisherId"), false);
	assert.equal(Object.hasOwn(publicState, "finalTurnQueue"), false);
});

test("buildPublicState() doesn't mutate the private GameState", () => {
	const game = createTestGame();
	const before = structuredClone(game);

	buildPublicState(game);
	assert.deepEqual(game, before);
});

test("buildPublicState() rejects a pending card without a pending card \
source", () => {
	const game = createTestGame();
	const pendingCard = game.deck.pop();

	assert.ok(pendingCard);

	game.pendingCard = pendingCard;
	game.pendingCardSource = null;
	assert.throws(
		() => buildPublicState(game),
		{ message: "Invalid GameState: inconsistent pending card state" }
	);
});

test("buildPublicState() rejects a pending card source without a pending \
card", () => {
	const game = createTestGame();

	game.pendingCard = null;
	game.pendingCardSource = CARD_SOURCE.DECK;
	assert.throws(() => buildPublicState(game), { message: "Invalid GameState:\
 inconsistent pending card state" });
});
