import test from "node:test";
import assert from "node:assert/strict";

import {
	BOARD_SIZE,
} from "../constants";

import {
	buildFinalTurnQueue,
	getNextPlayerId,
	hasHiddenCards,
} from "../turn";

import type {
	BoardSlot,
	PlayerState,
} from "../types";

function createPlayer(id : string): PlayerState {
	const board: BoardSlot[] = [];
	for (let position = 0; position < BOARD_SIZE; position++) {
		board.push({ card: { id: position, value: 0 }, revealed: true });
	}
	return { id, board, totalScore: 0 };
}

function createPlayers(): PlayerState[] {
	return [
		createPlayer("user-1"),
		createPlayer("user-2"),
		createPlayer("user-3"),
		createPlayer("user-4"),
	];
}

test("hasHiddenCard() returns true when at least one occupied card is hidden",
	 () => {
	const player = createPlayer("user-1");
	const slot = player.board[6];
	assert.ok(slot);
	slot.revealed = false;
	assert.equal(hasHiddenCards(player), true);
});

test("hasHiddenCards() returns false when every occupied card is revealed",
	 () => {
	const player = createPlayer("user-1");
	assert.equal(hasHiddenCards(player), false);
});

test("hasHiddenCards() ignores removed board positions", () => {
	const player = createPlayer("user-1");
	player.board[2] = null;
	player.board[6] = null;
	player.board[10] = null;
	assert.equal(hasHiddenCards(player), false);
});

test("getNextPlayerId() returns the following player", () => {
	const players = createPlayers();
	assert.equal(getNextPlayerId(players, "user-1"), "user-2");
	assert.equal(getNextPlayerId(players, "user-2"), "user-3");
	assert.equal(getNextPlayerId(players, "user-3"), "user-4");
});

test("getNextPlayerId() wraps from the last player to the first", () => {
	const players = createPlayers();
	assert.equal(getNextPlayerId(players, "user-4"), "user-1");
});

test("getNextPlayerId() rejects a player outside the turn order", () => {
	const players = createPlayers();
	assert.throws(() => getNextPlayerId(players, "missing-user"),
				  { message: "Invalid GameState: player doesn't exist in turn \
order" });
});

test("buildFinalTurnQueue() lists every other playre after the finisher", () => {
	const players = createPlayers();
	assert.deepEqual(buildFinalTurnQueue(players, "user-1"),
					 ["user-2", "user-3", "user-4"]);
});

test("buildFinalTurnQueue() preserves circular order when the finisher is in \
the middle", () => {
	const players = createPlayers();
	assert.deepEqual(buildFinalTurnQueue(players, "user-2"),
					 ["user-3", "user-4", "user-1"]);
});

test("buildFinalTurnQueue() wraps after a last-position finisher", () => {
	const players = createPlayers();
	assert.deepEqual(buildFinalTurnQueue(players, "user-4"),
					 ["user-1", "user-2", "user-3"]);
});

test("buildFinalTurnQueue() creates one final turn for the other player in a \
two-player game", () => {
	const players = [createPlayer("user-1"), createPlayer("user-2")];
	assert.deepEqual(buildFinalTurnQueue(players, "user-1"), ["user-2"]);
});

test("buildFinalTurnQueue() rejects an unknown finisher", () => {
	const players = createPlayers();
	assert.throws(() => buildFinalTurnQueue(players, "missing-user"),
				  { message: "Invalid GameState: finisher doesn't exist in \
turn order" });
});
