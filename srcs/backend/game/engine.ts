import {
	ACTION,
	BOARD_SIZE,
	ERROR_CODE,
	MAX_PLAYERS,
	MIN_PLAYERS,
	PHASE,
} from "./constants";

import type {
	ApplyActionResult,
	BoardSlot,
	CreateGameInput,
	GameCommand,
	GameState,
	PlayerState,
} from "./types";

import {
	createDeck,
	shuffleDeck,
	takeTopCard,
} from "./deck";

export function createGame(input: CreateGameInput,
						   random: () => number = Math.random): GameState {
	if (input.players.length < MIN_PLAYERS
		|| input.players.length > MAX_PLAYERS) {
		throw new Error(`createGame() requires ${MIN_PLAYERS} to \
${MAX_PLAYERS}`);
	}

	if (input.id.trim().length === 0) {
		throw new Error("createGame() requires a non-empty game-ID");
	}

	for (const player of input.players) {
		if (player.id.trim().length === 0) {
			throw new Error("createGame() requires non-empty player IDs");
		}
	}

	const playerIds = input.players.map((player) => player.id);
	const uniquePlayerIds = new Set(playerIds);
	if (uniquePlayerIds.size !== playerIds.length) {
		throw new Error("createGame() requires unique player IDs");
	}







	const deck = shuffleDeck(createDeck(), random);
	const players: PlayerState[] = [];

	for (const playerInput of input.players) {
		const board: BoardSlot[] = [];
		for (let pos = 0; pos < BOARD_SIZE; pos++) {
			const card = takeTopCard(deck);
			board.push({card, revealed: false});
		}
		players.push({id: playerInput.id, board, totalScore: 0});
	}

	const firstDiscard = takeTopCard(deck);
	const discardPile = [firstDiscard];



	const gameState: GameState = {
		id: input.id,
		players,
		deck,
		discardPile,
		phase: PHASE.INITIAL_REVEAL,
		turnStage: null,
		currentPlayerId: null,
		pendingCard: null,
		pendingCardSource: null,
		roundNumber: 1,
		roundFinisherId: null,
		finalTurnQueue: [],
		version: 0,
	};
	return gameState;
}

export function applyAction(oldState: GameState, command: GameCommand):
	ApplyActionResult {

    const state = structuredClone(oldState);
    switch (command.type) {

        case ACTION.REVEAL_INITIAL_CARD:
            break;

        case ACTION.DRAW_DECK:
            break;

        case ACTION.DRAW_DISCARD:
            break;

        case ACTION.SWAP_CARD:
            break;

        case ACTION.DISCARD_DRAWN_CARD:
            break;

        case ACTION.REVEAL_CARD:
            break;

        default:
            return {
                ok: false,

                error: {
                    code:
                        ERROR_CODE.UNKNOWN_ACTION,
                },
            };
    }
    throw new Error("Action not implemented");
}
