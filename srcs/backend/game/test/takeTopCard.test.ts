import test from "node:test";
import assert from "node:assert/strict";

import type {
	Card,
} from "../types";

import {
	takeTopCard,
} from "../deck";

test("takeTopCard() returns the last card of the deck", () => {
	const deck: Card[] = [
		{ id: 0, value: -2 }, { id: 1, value: 5 }, { id: 2, value: 12 }];

	const card = takeTopCard(deck);
	assert.deepEqual(card, { id: 2, value: 12 });
});

test("takeTopCard() removes the returned card from the deck", () => {
	const deck: Card[] = [
		{ id: 0, value: -2 }, { id: 1, value: 5 }, { id: 2, value: 12 }];
	
	takeTopCard(deck);
	assert.deepEqual(deck.map((card) => card.id), [0, 1]);
	assert.equal(deck.length, 2);
});

test("takeTopCard() removes cards in last-in-first-out order", () => {
	const deck: Card[] = [
		{ id: 0, value: -2 }, { id: 1, value: 5 }, { id: 2, value: 12 }];
	
	const first = takeTopCard(deck);
	const second = takeTopCard(deck);
	const third = takeTopCard(deck);

	assert.equal(first.id, 2);
	assert.equal(second.id, 1);
	assert.equal(third.id, 0);
	assert.equal(deck.length, 0);
});

test("takeTopCard() throws when the deck is empty", () => {
	const deck: Card[] = [];
	assert.throws(
		() => takeTopCard(deck), { message:
		"Cannot take the top card from an empty deck" });
});
