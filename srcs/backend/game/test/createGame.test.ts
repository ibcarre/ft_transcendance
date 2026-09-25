import test from "node:test";
import assert from "node:assert/strict";

import {
    createGame,
} from "../index";

import {
	PHASE,
} from "../constants"

import {
	GameState,
	Card
} from "../types"

test("createGame() creates one 12-card board per player", () => {
        const game = createGame(
			{
                id: "game-test",
                players: [{ id: "alice" }, { id: "bob" }]}, () => 0.5);

        assert.equal(game.players.length, 2);
        assert.equal(game.players[0]?.board.length, 12);
        assert.equal(game.players[1]?.board.length, 12);
    }
);

test("createGame() leaves 125 cards in the draw pile for 2 players", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }]});

	assert.equal(game.deck.length, 125);
});

test("createGame() leaves 113 cards in the draw pile for 3 players", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }, { id: "charlie" }]});

	assert.equal(game.deck.length, 113);
});

test("createGame() leaves 101 cards in the draw pile for 4 players", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }, { id: "charlie" },
			{ id: "davis"}]});

	assert.equal(game.deck.length, 101);
});

test("createGame() initializes the discard pile with one card", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }]});

	assert.equal(game.discardPile.length, 1);
});

test("createGame() initializes every board card as hidden", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }]});

	for (const player of game.players) {
		for (const slot of player.board) {
			assert.notEqual(slot, null);
			assert.equal(slot?.revealed, false);
		}
	}
});

test("createGame() initializes every player score to zero", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }]});

	for (const player of game.players) {
		assert.equal(player.totalScore, 0);
	}
});

test("createGame() initializes the game control state", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }]});

	assert.equal(game.phase, PHASE.INITIAL_REVEAL);
	assert.equal(game.turnStage, null);
	assert.equal(game.currentPlayerId, null);
	assert.equal(game.pendingCard, null);
	assert.equal(game.pendingCardSource, null);
	assert.equal(game.roundNumber, 1);
	assert.equal(game.roundFinisherId, null);
	assert.deepEqual(game.finalTurnQueue, []);
	assert.equal(game.version, 0);
});

function collectAllCards(game: GameState): Card[] {
	const cards: Card[] = [...game.deck, ...game.discardPile];

	for (const player of game.players) {
		for (const slot of player.board) {
			if (slot !== null) {
				cards.push(slot.card);
			}
		}
	}
	if (game.pendingCard !== null) {
		cards.push(game.pendingCard);
	}
	return cards;
}

test("createGame() preserves all 150 unique cards", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }, { id: "charlie" },
			{ id: "davis"}]});

	const cards = collectAllCards(game);
	assert.equal(cards.length, 150);

	const ids = cards.map((card) => card.id);
	const uniqueIds = new Set(ids);
	assert.equal(uniqueIds.size, 150);
});

test("createGame() preserves player order", () => {
	const game = createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }, { id: "charlie" }]});

	assert.deepEqual(game.players.map((player) => player.id), ["alice", "bob", "charlie"]);
});

test("createGame() is reproductible with the same random source", () => {
	const input = {
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }]};

	const firstGame = createGame(input, () => 0.5);
	const secondGame = createGame(input, () => 0.5);

	assert.deepEqual(firstGame, secondGame);
});

test("createGame() doesn't mutate its input", () => {
	const input = {
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }]};

	const before = structuredClone(input);
	createGame(input);
	assert.deepEqual(input, before);
});

test("createGame() rejects fewer than two players", () => {
	assert.throws(() => createGame({
		id: "game-test",
		players: [{ id: "alice" }]}));
});

test("createGame() rejects more than four players", () => {
	assert.throws(() => createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "bob" }, { id: "charlie" },
			{ id: "davis" }, { id: "ernest" }]}));
});

test("createGame() rejects duplicate player IDs", () => {
	assert.throws(() => createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "alice" }]}));
});

test("createGame() rejects empty player ID", () => {
	assert.throws(() => createGame({
		id: "game-test",
		players: [{ id: "alice" }, { id: "" }]}));
});

test("createGame() rejects empty game ID", () => {
	assert.throws(() => createGame({
		id: "",
		players: [{ id: "alice" }, { id: "bob" }]}));
});
