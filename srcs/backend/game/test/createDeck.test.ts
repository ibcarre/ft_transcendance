import test from "node:test";
import assert from "node:assert/strict";

import type {
	Card,
	CardValue,
} from "../types";

import {
	createDeck,
} from "../deck";




const EXPECTED_DISTRIBUTION:
	ReadonlyArray<readonly [CardValue, number]> = [
		[-2, 5],
		[-1, 10],
		[0, 15],
		[1, 10],
		[2, 10],
		[3, 10],
		[4, 10],
		[5, 10],
		[6, 10],
		[7, 10],
		[8, 10],
		[9, 10],
		[10, 10],
		[11, 10],
		[12, 10],
	];




test ("createDeck() creates exactly 150 cards", () => {
	const deck = createDeck();
	assert.equal(deck.length, 150);
	},
);

test("createDeck() gives every card a unique ID", () => {
	const deck = createDeck();
	const ids = deck.map((card) => card.id);
	const uniqueIds = new Set(ids);

	assert.equal(uniqueIds.size, deck.length);
	},
);

test("createDeck() assigns sequential IDs from 0 to 149", () => {
	const deck = createDeck();

	for (let i = 0; i < deck.length; i++) {
		assert.equal(deck[i]?.id, i, `Expected card at index ${i}`);
	}
});

function countCardsWithValue(deck: readonly Card[], value: CardValue): number {
	return deck.filter((card) => card.value === value).length;
}

test("createDeck() only contains valid Skyjo card values", () => {
	const deck = createDeck();
	const expectedValues = new Set(EXPECTED_DISTRIBUTION.map(
		([value]) => value));

	for (const card of deck) {
		assert.ok(expectedValues.has(card.value), `Unexpected card value: 
				  ${card.value}`);
	}
});

test("createDeck() creates the expected card distribution", () => {
	const deck = createDeck();

	for (const [value, expectedCount] of EXPECTED_DISTRIBUTION) {
		const actualCount = countCardsWithValue(deck, value);
		assert.equal(actualCount, expectedCount, `Expected ${expectedCount} \
cards with value ${value}, got ${actualCount}`);
	}
});

test("createDeck() creates a new deck on every call", () => {
	const firstDeck = createDeck();
	const secondDeck = createDeck();

	assert.notStrictEqual(firstDeck, secondDeck);
});

test("createDeck() creates new card objects on every call", () => {
	const firstDeck = createDeck();
	const secondDeck = createDeck();

	assert.notStrictEqual(firstDeck[0], secondDeck[0]);
});

test("decks created by separate calls are independent", () => {
	const firstDeck = createDeck();
	const secondDeck = createDeck();

	firstDeck.pop();
	assert.equal(firstDeck.length, 149);
	assert.equal(secondDeck.length, 150);
});
