import test from "node:test";
import assert from "node:assert/strict";

import {
	BOARD_COLUMNS,
	BOARD_SIZE,
} from "../constants";

import {
	removeAllCompletedColumns,
	revealAllCards,
} from "../board";

import {
	createGame,
} from "../engine";

import type {
	BoardSlot,
	Card,
	CardValue,
	PlayerState,
} from "../types";

function createPlayer(): PlayerState {
	const board: BoardSlot[] = [];
	for (let position = 0; position < BOARD_SIZE; position++) {
		let value: CardValue = 1;
		if (position >= BOARD_COLUMNS * 2) {
			value = 3;
		}
		else if (position >= BOARD_COLUMNS) {
			value = 2;
		}
		board.push({ card: { id: position, value }, revealed: false });
	}
	return { id: "user-1", board, totalScore: 37 };
}

function configureColumn(player: PlayerState, column: number, value: CardValue,
						 revealed: boolean): void {
	for (let row = 0; row < 3; row++) {
		const position = column + row * BOARD_COLUMNS;
		const slot = player.board[position];
		assert.ok(slot);
		slot.card.value = value;
		slot.revealed = revealed;
	}
}

test("revealAllCards() reveals every occupied board card without changing its \
value or ID", () => {
	const player = createPlayer();
	const before = structuredClone(player.board);
	revealAllCards(player);
	for (let position = 0; position < BOARD_SIZE; position++) {
		const slot = player.board[position];
		const previousSlot = before[position];
		assert.ok(slot);
		assert.ok(previousSlot);
		assert.equal(slot.revealed, true);
		assert.deepEqual(slot.card, previousSlot.card);
	}
	assert.equal(player.totalScore, 37);
});

test("revealAllCards() preserves removed slots and previously revealed cards",
() => {
	const player = createPlayer();
	player.board[1] = null;
	player.board[5] = null;
	player.board[9] = null;
	const alreadyRevealed = player.board[4];
	assert.ok(alreadyRevealed);
	alreadyRevealed.revealed = true;
	revealAllCards(player);
	for (let position = 0; position < BOARD_SIZE; position++) {
		const slot = player.board[position];
		if (position === 1 || position === 5 || position === 9) {
			assert.equal(slot, null);
		}
		else {
			assert.ok(slot);
			assert.equal(slot.revealed, true);
		}
	}
});

test("revealAllCards() is idempotent", () => {
	const player = createPlayer();
	revealAllCards(player);
	const firstResult = structuredClone(player);
	revealAllCards(player);
	assert.deepEqual(player, firstResult);
});

test("revealAllCards() rejects a board with the wrong number of positions",
() => {
	const player = createPlayer();
	player.board.pop();
	assert.throws(() => revealAllCards(player),
				  { message: "Invalid GameState: player board must have \
12 positions" });
});

test("removeAllCompletedColumns() rejects a board with the wrong number of \
positions", () => {
	const player = createPlayer();
	player.board.push({ card: { id: 123, value: 1 }, revealed: true });
	const discardPile: Card[] = [];
	assert.throws(() => removeAllCompletedColumns(player, discardPile),
				  { message: "Invalid GameState: player board must have 12 \
positions" });
	assert.deepEqual(discardPile, []);
});

test("removeAllCompletedColumns() leaves non-matching columns unchanged",
() => {
	const player = createPlayer();
	revealAllCards(player);
	const before = structuredClone(player);
	const discardPile: Card[] = [{ id: 999, value: -1 }];
	removeAllCompletedColumns(player, discardPile);
	assert.deepEqual(player, before);
	assert.deepEqual(discardPile, [{ id: 999, value: -1 }]);
});

test("removeAllCompletedColumns() removes one complete column and preserves \
discard order", () => {
	const player = createPlayer();
	configureColumn(player, 1, 7, true);
	const discardPile: Card[] = [{ id: 999, value: -1 }];
	const before = structuredClone(player.board);
	removeAllCompletedColumns(player, discardPile);
	assert.equal(player.board[1], null);
	assert.equal(player.board[5], null);
	assert.equal(player.board[9], null);
	assert.deepEqual(discardPile.map((card) => card.id), [999, 1, 5, 9]);
	for (let position = 0; position < BOARD_SIZE; position++) {
		if (position === 1 || position === 5 || position === 9) {
			continue;
		}
		assert.deepEqual(player.board[position], before[position]);
	}
});

test("final reveal and column removal handle two non-adjacent columns",
() => {
	const player = createPlayer();
	configureColumn(player, 1, 7, false);
	configureColumn(player, 3, 5, false);
	const discardPile: Card[] = [];
	revealAllCards(player);
	removeAllCompletedColumns(player, discardPile);
	for (const position of [1, 3, 5, 7, 9, 11]) {
		assert.equal(player.board[position], null);
	}
	for (const position of [0, 2, 4, 6, 8, 10]) {
		const slot = player.board[position];
		assert.ok(slot);
		assert.equal(slot.revealed, true);
	}
	assert.deepEqual(discardPile.map((card) => card.id), [1, 5, 9, 3, 7, 11]);
});

test("removeAllCompletedColumns() can remove all four columns", () => {
	const player = createPlayer();
	for (let column = 0; column < BOARD_COLUMNS; column++) {
		configureColumn(player, column, 0, true);
	}
	const discardPile: Card[] = [];
	removeAllCompletedColumns(player, discardPile);
	for (const slot of player.board) {
		assert.equal(slot, null);
	}
	assert.equal(discardPile.length, BOARD_SIZE);
});

test("removeAllCompletedColumns() ignores a column containing a hidden card",
() => {
	const player = createPlayer();
	configureColumn(player, 0, 7, true);
	const hiddenSlot = player.board[8];
	assert.ok(hiddenSlot);
	hiddenSlot.revealed = false;
	const discardPile: Card[] = [];
	removeAllCompletedColumns(player, discardPile);
	assert.equal(discardPile.length, 0);
	assert.ok(player.board[0]);
	assert.ok(player.board[4]);
	assert.ok(player.board[8]);
});

test("removeAllCompletedColumns() ignores previously removed positions",
() => {
	const player = createPlayer();
	configureColumn(player, 2, 4, true);
	player.board[6] = null;
	const discardPile: Card[] = [];
	const before = structuredClone(player.board);
	removeAllCompletedColumns(player, discardPile);
	assert.deepEqual(player.board, before);
	assert.equal(discardPile.length, 0);
});

test("removeAllCompletedColumns() is idempotent", () => {
	const player = createPlayer();
	configureColumn(player, 0, 7, true);
	const discardPile: Card[] = [];
	removeAllCompletedColumns(player, discardPile);
	const boardAfterFirstCall = structuredClone(player.board);
	const pileAfterFirstCall = structuredClone(discardPile);
	removeAllCompletedColumns(player, discardPile);
	assert.deepEqual(player.board, boardAfterFirstCall);
	assert.deepEqual(discardPile, pileAfterFirstCall);
});

for (const value of [-2, 0] as const) {
	test(`removeAllCompletedColumns() also removes equal columns of value \
	${value}`, () => {
		const player = createPlayer();
		configureColumn(player, 0, value, true);
		const discardPile: Card[] = [];
		removeAllCompletedColumns(player, discardPile);
		assert.equal(player.board[0], null);
		assert.equal(player.board[4], null);
		assert.equal(player.board[8], null);
		assert.deepEqual(discardPile.map((card) => card.value),
						 [value, value, value]);
	});
}

test("final board helper conserve all 150 cards in a real four-player \
game", () => {
	const game = createGame({ id: "game-1",
							players: [{ id: "user-1" }, { id: "user-2" },
									{ id: "user-3" }, { id: "user-4" }]},
							() => 0.5);
	const initialVersion = game.version;
	const initialRoundNumber = game.roundNumber;
	for (const player of game.players) {
		revealAllCards(player);
		removeAllCompletedColumns(player, game.discardPile);
		assert.equal(player.totalScore, 0);
		for (const slot of player.board) {
			if (slot !== null) {
				assert.equal(slot.revealed, true);
			}
		}
	}
	const allCards: Card[] = [];
	for (const card of game.deck) {
		allCards.push(card);
	}
	for (const card of game.discardPile) {
		allCards.push(card);
	}
	for (const player of game.players) {
		for (const slot of player.board) {
			if (slot !== null) {
				allCards.push(slot.card);
			}
		}
	}
	assert.equal(allCards.length, 150);
	const uniqueIds = new Set<number>();
	for (const card of allCards) {
		uniqueIds.add(card.id);
	}
	assert.equal(uniqueIds.size, 150);
	assert.equal(game.version, initialVersion);
	assert.equal(game.roundNumber, initialRoundNumber);
});
