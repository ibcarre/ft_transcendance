import test from "node:test";
import assert from "node:assert/strict";

import {
	BOARD_COLUMNS,
	BOARD_SIZE,
} from "../constants";

import {
	buildRoundResult,
	calculateBoardScore,
	calculateFinisherScore,
} from "../scoring";

import type {
	BoardSlot,
	CardValue,
	PlayerState,
} from "../types";

// Only the first column contains cards. The three other columns have been 
// removed already; the remaining three cards are revealed and not identical.
function createPlayer(id: string,
					  values: readonly [CardValue, CardValue, CardValue]):
						  PlayerState {
	const board: BoardSlot[] = [];
	for (let position = 0; position < BOARD_SIZE; position++) {
		board.push(null);
	}
	for (let row = 0; row < 3; row++) {
		const value = values[row];
		if (value === undefined) {
			throw new Error("Invalid test feature: missing card value")
		}
		board[row * BOARD_COLUMNS] = {
			card: { id: row, value }, revealed: true };
	}
	return { id, board, totalScore: 42 };
}

function createPlayers(): PlayerState[] {
	return [createPlayer("user-1", [2, 3, 5]),
			createPlayer("user-2", [3, 4, 5]),
			createPlayer("user-3", [4, 5, 6])];
}

test("calculateBoardScore() sums revealed cards and ignores removed positions",
() => {
	const player = createPlayer("user-1", [-2, 3, 10]);
	assert.equal(calculateBoardScore(player), 11);
});

test("calculateBoardScore() can return a negative score", () => {
	const player = createPlayer("user-1", [-2, -2, 1]);
	assert.equal(calculateBoardScore(player), -3);
});

test("calculateBoardScore() returns zero for a completely removed board",
() => {
	const player = createPlayer("user-1", [2, 3, 5]);
	for (let position = 0; position < BOARD_SIZE; position++) {
		player.board[position] = null;
	}
	assert.equal(calculateBoardScore(player), 0);
});

test("calculateBoardScore() doesn't change the board or totalScore", () => {
	const player = createPlayer("user-1", [2, 3, 5]);
	const before = structuredClone(player);
	assert.equal(calculateBoardScore(player), 10);
	assert.deepEqual(player, before);
});

test("calculateBoardScore() refuses a hidden card", () => {
	const player = createPlayer("user-1", [2, 3, 5]);
	const slot = player.board[0];
	assert.ok(slot);
	slot.revealed = false;
	assert.throws(() => calculateBoardScore(player),
				  { message: "Invalid GameState: can't score a hidden card"});
});

test("calculateBoardScore() refuses a board with the wrong size", () => {
	const player = createPlayer("user-1", [2, 3, 5]);
	player.board.pop();
	assert.throws(() => calculateBoardScore(player),
				  { message: "Invalid GameState: can't score a board with an \
invalid size"});
});

test("calculateFinisherScore() leaves a strictly lowest score unchanged",
() => {
	assert.equal(calculateFinisherScore(10, [11, 20]), 10);
});

test("calculateFinisherScore() doubles a positive score tied for lowest",
() => {
	assert.equal(calculateFinisherScore(10, [10, 20]), 20);
});

test("calculateFinisherScore() doubles a positive score beaten by an opponent",
() => {
	assert.equal(calculateFinisherScore(10, [20, 7]), 20);
});

test("calculateFinisherScore() never doubles a zero score", () => {
	assert.equal(calculateFinisherScore(0, [0, -3]), 0);
});

test("calculateFinisherScore() never doubles a negative score", () => {
	assert.equal(calculateFinisherScore(-3, [-4, 10]), -3);
});

test("calculateFinisherScore() requires at least one opponent", () => {
	assert.throws(() => calculateFinisherScore(10, []),
			{ message: "Invalid GameState: the finisher must have opponents" });
});

test("buildRoundResult() keeps the initial scores when the finisher is \
strictly lowest", () => {
	const result = buildRoundResult(createPlayers(), 2, "user-3", "user-1");
	assert.equal(result.roundNumber, 2);
	assert.equal(result.starterId, "user-3");
	assert.equal(result.finisherId, "user-1");
	assert.deepEqual(result.scores, [
		{ playerId: "user-1", baseScore: 10, finalScore: 10 },
		{ playerId: "user-2", baseScore: 12, finalScore: 12 },
		{ playerId: "user-3", baseScore: 15, finalScore: 15 }]);
});

test("buildRoundResult() penalizes only the finisher after a tie", () => {
	const players = [createPlayer("user-1", [2, 3, 5]),
					createPlayer("user-2", [1, 4, 5])];
	const result = buildRoundResult(players, 1, "user-1", "user-1");
	assert.deepEqual(result.scores, [
		{ playerId: "user-1", baseScore: 10, finalScore: 20 },
		{ playerId: "user-2", baseScore: 10, finalScore: 10 }]);
});

test("buildRoundResult() uses round scores, not cumulative scores, for the \
penalty", () => {
	const players = createPlayers();
	players[0]!.totalScore = 150;
	players[1]!.totalScore = -10;
	const result = buildRoundResult(players, 4, "user-2", "user-1");
	assert.equal(result.scores[0]?.finalScore, 10);
	
});

test("buildRoundResult() handles four players and retains their order", () => {
	const players = createPlayers();
	players.push(createPlayer("user-4", [1, 1, 3]));
	const result = buildRoundResult(players, 7, "user-2", "user-3");
	assert.deepEqual(result.scores, [
		{ playerId: "user-1", baseScore: 10, finalScore: 10 },
		{ playerId: "user-2", baseScore: 12, finalScore: 12 },
		{ playerId: "user-3", baseScore: 15, finalScore: 30 },
		{ playerId: "user-4", baseScore: 5, finalScore: 5 }]);
});

test("buildRoundResult() handles a negative finisher even if an opponent does \
better", () => {
	const players = [createPlayer("user-1", [-2, -2, 1]),
					createPlayer("user-2", [-2, -2, 0])];
	const result = buildRoundResult(players, 4, "user-2", "user-1");
	assert.equal(result.scores[0]?.baseScore, -3);
	assert.equal(result.scores[0]?.finalScore, -3);
});

test("buildRoundResult() doesn't mutate players or cumulative scores", () => {
	const players = createPlayers();
	const before = structuredClone(players);
	buildRoundResult(players, 2, "user-2", "user-3");
	assert.deepEqual(players, before);
});

test("buildRoundResult() rejects an unknown starter", () => {
	assert.throws(() => buildRoundResult(createPlayers(), 1,
										 "missing", "user-1"),
	{ message: "Invalid GameState: round starter doesn't exist" });
});

test("buildRoundResult() rejects an unknown finisher", () => {
	assert.throws(() => buildRoundResult(createPlayers(), 1,
										 "user-1", "missing"),
	{ message: "Invalid GameState: round finisher doesn't exist" });
});

test("buildRoundResult() rejects duplicate player IDs", () => {
	const players = createPlayers();
	players[1]!.id = "user-1";
	assert.throws(() => buildRoundResult(players, 1,
										 "user-1", "user-1"),
	{ message: "Invalid GameState: duplicate player ID during scoring" });
});

for (const roundNumber of [0, -1, 1.5, Number.NaN]) {
	test(`buildRoundResult() rejects invalid round number ${String(roundNumber)}`, () => {
		assert.throws(() => buildRoundResult(createPlayers(), roundNumber,
											 "user-1", "user-1"),
		{ message: "Invalid GameState: invalid round number for scoring" });
	});
}

test("buildRoundResult() rejects a game with only one player", () => {
	const players = [createPlayer("user-1", [2, 3, 5])];
	assert.throws(() => buildRoundResult(players, 1, "user-1", "user-1"),
	{ message: "Invalid GameState: invalid number of players for scoring" });
});
