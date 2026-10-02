import test from "node:test";
import assert from "node:assert/strict";

import {
	BOARD_SIZE,
} from "../constants";

import {
	getColumnPositions,
	isValidBoardPosition,
	removeCompletedColumnAtPosition,
} from "../board";

import type {
	Card,
	CardValue,
	PlayerState,
} from "../types";

function createPlayer(): PlayerState {
	return { id: "user-1",
			board: Array.from({ length: BOARD_SIZE },
							  (_, index) => ({ card: { id: index, value: 0 },
											 revealed: false })),
			totalScore: 0};
}

function configureCard(player: PlayerState, position: number, value: CardValue,
					   revealed: boolean): void {
	const slot = player.board[position];
	assert.ok(slot);
	slot.card.value = value;
	slot.revealed = revealed;
}

test("isValidBoardPosition() accepts positions 0 through 11", () => {
	for (let position = 0; position < BOARD_SIZE; position++) {
		assert.equal(isValidBoardPosition(position), true);
	}
});

for (const position of [-1, 12, 1.5, Number.NaN]) {
	test(`isValidBoardPosition() rejects ${String(position)}`, () => {
		assert.equal(isValidBoardPosition(position), false);
	});
}

const COLUM_CASES:
	ReadonlyArray<readonly [number, readonly [number, number, number]]> =
	[
		[0, [0, 4, 8]],
		[1, [1, 5, 9]],
		[2, [2, 6, 10]],
		[3, [3, 7, 11]],

		[4, [0, 4, 8]],
		[5, [1, 5, 9]],
		[6, [2, 6, 10]],
		[7, [3, 7, 11]],

		[8, [0, 4, 8]],
		[9, [1, 5, 9]],
		[10, [2, 6, 10]],
		[11, [3, 7, 11]],
	];

for (const [position, expectedColumn] of COLUM_CASES) {
	test(`getColumnPositions(${position}) returns the correct column`,
		 () => {
		assert.deepEqual(getColumnPositions(position), expectedColumn);
	});
}

for (const position	of [-1, 12,	1.5, Number.NaN]) {
	test(`getColumnPositions() rejects invalid position ${String(position)}`,
		 () => {
			assert.throws(() =>	getColumnPositions(position),
						  { message: "Invalid board position" });
		});
}

test("removeCompletedColumnAtPosition() removes three equal revealed cards", () => {
	const player = createPlayer();
	configureCard(player, 1, 7, true);
	configureCard(player, 5, 7, true);
	configureCard(player, 9, 7, true);
	const removedCards = [player.board[1]?.card, player.board[5]?.card, player.board[9]?.card];
	assert.ok(removedCards[0]);
	assert.ok(removedCards[1]);
	assert.ok(removedCards[2]);
	const discardPile: Card[] = [{ id:1000, value: -1 }];
	const removed = removeCompletedColumnAtPosition(player, 5, discardPile);
	assert.equal(removed, true);
	assert.equal(player.board[1], null);
	assert.equal(player.board[5], null);
	assert.equal(player.board[9], null);
	assert.equal(discardPile.length, 4);
	assert.deepEqual(discardPile.slice(1).map((card) => card.id), [1, 5, 9]);
});

test("removeCompletedColumnAtPosition() doesn't remove a column containing a hidden card", () => {
	const player = createPlayer();
	configureCard(player, 2, 5, true);
	configureCard(player, 6, 5, false);
	configureCard(player, 10, 5, true);
	const beforePlayer = structuredClone(player);
	const discardPile: Card[] = [];
	const removed = removeCompletedColumnAtPosition(player, 6, discardPile);
	assert.equal(removed, false);
	assert.deepEqual(player, beforePlayer);
	assert.deepEqual(discardPile, []);
});

test("removeCompletedColumnAtPosition() ignores a column containing a removed position", () => {
	const player = createPlayer();
	configureCard(player, 3, 4, true);
	configureCard(player, 11, 4, true);
	player.board[7] = null;
	const discardPile: Card[] = [];
	const removed = removeCompletedColumnAtPosition(player, 3, discardPile);
	assert.equal(removed, false);
	assert.equal(player.board[7], null);
	assert.equal(discardPile.length, 0);
});

test("removeCompletedColumnAtPosition() leaves all other board positions unchanged", () => {
	const player = createPlayer();
	configureCard(player, 1, 6, true);
	configureCard(player, 5, 6, true);
	configureCard(player, 9, 6, true);
	const boardBefore = structuredClone(player.board);
	const discardPile: Card[] = [];
	const removed = removeCompletedColumnAtPosition(player, 9, discardPile);
	assert.equal(removed, true);
	for (let position = 0; position < BOARD_SIZE; position++) {
		if (position === 1 || position === 5 || position === 9) {
			assert.equal(player.board[position], null);
			continue;
		}
		assert.deepEqual(player.board[position], boardBefore[position]);
	}
});

test("removeCompletedColumnAtPosition() doesn't remove a column with different \
values", () => {
	const player = createPlayer();
	configureCard(player, 0, 8, true);
	configureCard(player, 4, 8, true);
	configureCard(player, 8, 9, true);
	const boardBefore = structuredClone(player.board);
	const discardPile: Card[] = [];
	const removed = removeCompletedColumnAtPosition(player, 4, discardPile);
	assert.equal(removed, false);
	assert.deepEqual(player.board, boardBefore);
	assert.equal(discardPile.length, 0);
});
