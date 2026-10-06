import test from "node:test";
import assert from "node:assert/strict";

import {
	createDeck,
	shuffleDeck,
} from "../deck";

import type {
	Card,
	// CardValue,
} from "../types";

test("shuffleDeck() preserves the number of cards", () => {
	const deck = createDeck();
	const shuffled = shuffleDeck(deck);

	assert.equal(shuffled.length, deck.length);
});

test("shuffleDeck() preserve all cards", () => {
	const deck = createDeck();
	const shuffled = shuffleDeck(deck);

	const originalIds = deck.map((card) => card.id).sort((a, b) => a - b);
	const shuffledIds = shuffled.map((card) => card.id).sort((a, b) => a - b);

	assert.deepEqual(shuffledIds, originalIds);
});

test("shuffleDeck() doesn't mutate the original deck", () => {
	const deck = createDeck();
	const before = structuredClone(deck);

	shuffleDeck(deck);
	assert.deepEqual(deck, before);
});

test("shuffleDeck() returns a new array", () => {
	const deck = createDeck();
	const shuffled = shuffleDeck(deck);

	assert.notStrictEqual(shuffled, deck);
});


test("shuffleDeck() produces a deterministic result with a known random \
sequence", () => {
	const deck: Card[] = [
		{ id: 0, value: -2 }, { id: 1, value: -1 }, { id: 2, value: 0 },
		{ id: 3, value: 1 }];
	
	const randomValues = [0.5, 0.1, 0.9];
	let randomIndex = 0;

	const fakeRandom = (): number => {
		const value = randomValues[randomIndex];
		if (value === undefined) {
			throw new Error("fakeRandom() called too many times");
		}
		randomIndex++;
		return value;
	};

	const shuffled = shuffleDeck(deck, fakeRandom);
	assert.deepEqual(shuffled.map((card) => card.id), [3, 1, 0, 2]);
	assert.equal(randomIndex, 3);
})

