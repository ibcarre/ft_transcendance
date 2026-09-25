import test from "node:test";
import assert from "node:assert/strict";

import type {
	Card,
	CardValue,
} from "../types";

import {
	createDeck,
} from "../deck";





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

function countCardWithValue(deck: Card[], value: CardValue): number {
	return deck.filter((card) => card.value === value).length;
}
