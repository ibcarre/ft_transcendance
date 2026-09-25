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


function createDeck(): Card[]
{
	for (const [value, count] of CARD_DISTRIBUTION) {
		for (let i = 0; i < count; i++) {
		// add the real cards creation here`	
		}
	}
}
