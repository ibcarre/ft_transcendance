import {
	BOARD_COLUMNS,
	BOARD_SIZE,
} from "./constants";

import type {
	Card,
	PlayerState,
} from "./types";

export function isValidBoardPosition(position: number): boolean {
	return (Number.isInteger(position)
			&& position >= 0
			&& position < BOARD_SIZE);
}

export function getColumnPositions(position: number):
	readonly [number, number, number] {
	if (!isValidBoardPosition(position)) {
		throw new Error("Invalid board position");
	}
	const column = position % BOARD_COLUMNS;
	return [column, column + BOARD_COLUMNS, column + BOARD_COLUMNS * 2];
}

export function removeCompletedColumnAtPosition(player: PlayerState,
											   position: number,
											   discardPile: Card[]): boolean {
	const [topPosition,
			midPosition,
			bottomPosition] = getColumnPositions(position);
	const topSlot = player.board[topPosition];
	const midSlot = player.board[midPosition];
	const bottomSlot = player.board[bottomPosition];
	if (topSlot === undefined
		|| midSlot === undefined
		|| bottomSlot === undefined) {
		throw new Error("Invalid GameState: player board is missing an \
expected position");
	}
	if (topSlot === null || midSlot === null || bottomSlot === null) {
		return false;
	}
	if (!topSlot.revealed || !midSlot.revealed || !bottomSlot.revealed) {
		return false;
	}
	const value = topSlot.card.value;
	if (midSlot.card.value !== value || bottomSlot.card.value !== value) {
		return false;
	}
	discardPile.push(topSlot.card, midSlot.card, bottomSlot.card);
	player.board[topPosition] = null;
	player.board[midPosition] = null;
	player.board[bottomPosition] = null;
	return true;
}
