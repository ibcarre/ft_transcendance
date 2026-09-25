import type {
	Card,
	CardValue,
} from "./types";

const CARD_DISTRIBUTION:
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


export function createDeck(): Card[]
{
	const deck: Card[] = [];
	let nextId = 0;

	for (const [value, count] of CARD_DISTRIBUTION) {
		for (let i = 0; i < count; i++) {
			deck.push({id: nextId, value});
			nextId++;
		}
	}
	return deck;
}

/**
 * @param random Function returning a number in [0, 1).
 */
export function shuffleDeck(deck: readonly Card[],
							random: () => number = Math.random): Card[]
{
	const shuffled = [...deck];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
	}
	return shuffled;
}

export function takeTopCard(deck: Card[]): Card
{
	const card = deck.pop();

	if (card === undefined) {
		throw new Error("Cannot take the top card from an empty deck");
	}
	return card;
}
