import {
	ACTION,
	BOARD_SIZE,
	ERROR_CODE,
	MAX_PLAYERS,
	MIN_PLAYERS,
	PHASE,
	TURN_STAGE
} from "./constants";

import type {
	ApplyActionResult,
	BoardSlot,
	CreateGameInput,
	EngineFailure,
	GameCommand,
	GameState,
	PlayerId,
	PlayerState,
	RevealInitialCardCommand
} from "./types";

import type {
	ErrorCode,
} from "./constants";

import {
	buildPublicState,
} from "./publicState";

import {
	createDeck,
	shuffleDeck,
	takeTopCard,
} from "./deck";





function fail(code: ErrorCode): EngineFailure {
	return { ok: false, error: { code } };
}

function countRevealedCards(player: PlayerState): number {
	let count = 0;

	for (const slot of player.board) {
		if (slot !== null && slot.revealed) {
			count++;
		}
	}
	return count;
}

function hasCompletedInitialReveal(state: GameState): boolean {
	for (const player of state.players) {
		if (countRevealedCards(player) !== 2) {
			return false;
		}
	}
	return true;
}

function getInitialRevealSum(player: PlayerState): number {
	let revealCount = 0;
	let sum = 0;

	for (const slot of player.board) {
		if (slot !== null && slot.revealed) {
			revealCount++;
			sum += slot.card.value;
		}
	}
	if (revealCount !== 2) {
		throw new Error("Invalid GameState: initial reveal sum requires \
exactly ywo revealed cards");
	}
	return sum;
}

/**
 * @param random Function returning a number in [0, 1).
 */
function chooseInitialStartingPlayer(state: GameState,
									 random: () => number): PlayerId {
	let highestSum = Number.NEGATIVE_INFINITY;
	let tiedPlayerIds: PlayerId[] = [];

	for (const player of state.players) {
		const sum = getInitialRevealSum(player);
		if (sum > highestSum) {
			highestSum = sum;
			tiedPlayerIds = [player.id];
		}
		else if (sum === highestSum) {
			tiedPlayerIds.push(player.id);
		}
	}

	if (tiedPlayerIds.length === 0) {
		throw new Error("Invalid GameState: can't choose an initial starting \
player");
	}
	if (tiedPlayerIds.length === 1) {
		return tiedPlayerIds[0]!;
	}
	const index = Math.floor(random() * tiedPlayerIds.length);
	const selectedPlayerId = tiedPlayerIds[index];
	if (selectedPlayerId === undefined) {
		throw new Error("Invalid random source: expected a number in [0, 1)");
	}
	return selectedPlayerId;
}

function applyRevealInitialCard(state: GameState,
								command: RevealInitialCardCommand,
								random: () => number): ApplyActionResult {
	if (state.phase === PHASE.GAME_OVER) {
		return fail(ERROR_CODE.GAME_OVER);
	}
	if (state.phase !== PHASE.INITIAL_REVEAL) {
		return fail(ERROR_CODE.ACTION_NOT_ALLOWED);
	}
	const player =
		state.players.find((candidate) => candidate.id === command.playerId);
	if (player === undefined) {
		return fail(ERROR_CODE.PLAYER_NOT_FOUND);
	}
	if (!Number.isInteger(command.position)
		|| command.position < 0
		|| command.position >= BOARD_SIZE) {
		return fail(ERROR_CODE.INVALID_POSITION);
	}
	if (countRevealedCards(player) >= 2) {
		return fail(ERROR_CODE.ACTION_NOT_ALLOWED);
	}
	const slot = player.board[command.position];
	if (slot === undefined) {
		throw new Error("Invalid GameState: player board is missing an \
expected position");
	}
	if (slot === null) {
		throw new Error("Invalid GameState: removed board slot during initial \
reveal");
	}
	if (slot.revealed) {
		return fail(ERROR_CODE.CARD_NOT_HIDDEN);
	}
	slot.revealed = true;
	state.version++;
	if (hasCompletedInitialReveal(state)) {
		state.currentPlayerId = chooseInitialStartingPlayer(state, random);
		state.phase = PHASE.PLAYING;
		state.turnStage = TURN_STAGE.WAITING_FOR_DRAW;
	}
	return { ok: true, state, publicState: buildPublicState(state) };
}

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

/**
 * @param random Function returning a number in [0, 1).
 */
export function applyAction(oldState: GameState,
							command: GameCommand,
							random: () => number = Math.random):
								ApplyActionResult {

	const state = structuredClone(oldState);
	switch (command.type) {

		case ACTION.REVEAL_INITIAL_CARD:
			return applyRevealInitialCard(state, command, random);
		case ACTION.DRAW_DECK:
		case ACTION.DRAW_DISCARD:
		case ACTION.SWAP_CARD:
		case ACTION.DISCARD_DRAWN_CARD:
		case ACTION.REVEAL_CARD:
			throw new Error("Action not implemented");
		default:
			return fail(ERROR_CODE.UNKNOWN_ACTION);
	}
}
