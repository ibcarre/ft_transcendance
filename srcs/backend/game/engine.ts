import {
	ACTION,
	BOARD_SIZE,
	CARD_SOURCE,
	ERROR_CODE,
	MAX_PLAYERS,
	MIN_PLAYERS,
	PHASE,
	TURN_STAGE,
} from "./constants";

import type {
	ApplyActionResult,
	BoardSlot,
	CreateGameInput,
	DrawDeckCommand,
	DrawDiscardCommand,
	EngineSuccess,
	EngineFailure,
	GameCommand,
	GameState,
	PlayerId,
	PlayerState,
	RevealInitialCardCommand,
	SwapCardCommand,
} from "./types";

import type {
	ActionType,
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

import {
	getAllowedActionTypes,
} from "./stateMachine";

import {
	isValidBoardPosition,
	removeCompletedColumnAtPosition,
} from "./board";

import {
	buildFinalTurnQueue,
	getNextPlayerId,
	hasHiddenCards,
} from "./turn";




function fail(code: ErrorCode): EngineFailure {
	return { ok: false, error: { code } };
}

function succeed(state: GameState): EngineSuccess {
	return { ok: true, state, publicState: buildPublicState(state) };
}

function validateCurrentPlayerAction(state: GameState,
									 playerId: PlayerId,
									 actionType: ActionType):
									EngineFailure | null {
	if (state.phase === PHASE.GAME_OVER) {
		return fail(ERROR_CODE.GAME_OVER);
	}
	if (!getAllowedActionTypes(state).includes(actionType)) {
		return fail(ERROR_CODE.ACTION_NOT_ALLOWED);
	}
	const playerExists = state.players.some((player) => player.id === playerId);
	if (!playerExists) {
		return fail(ERROR_CODE.PLAYER_NOT_FOUND);
	}
	if (state.currentPlayerId === null) {
		throw new Error("Invalid GameState: PLAYING requires a current player");
	}
	const currentPlayerExists =
		state.players.some((player) => player.id === state.currentPlayerId);
	if (!currentPlayerExists) {
		throw new Error("Invalid GameState: currentPlayerId doesn't reference \
a player");
	}
	if (state.currentPlayerId !== playerId) {
		return fail(ERROR_CODE.NOT_YOUR_TURN);
	}
	return null;
}

function assertNoPendingCard(state: GameState): void {
	if (state.pendingCard !== null || state.pendingCardSource !== null) {
		throw new Error("Invalid GameState: WAITING_FOR_DRAW requires no \
pending card");
	}
}

function refillDrawPileIfNeeded(state: GameState, random: () => number): void {
	if (state.deck.length > 0) {
		return;
	}
	if (state.discardPile.length < 2) {
		throw new Error("Invalid GameState: can't refill the draw pile from a \
too small discard pile");
	}
	const topDiscard = takeTopCard(state.discardPile);
	state.deck = shuffleDeck(state.discardPile, random);
	state.discardPile = [topDiscard];
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
exactly two revealed cards");
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
	if (!isValidBoardPosition(command.position)) {
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
	return succeed(state);
}

function applyDrawDeck(state: GameState,
					   command: DrawDeckCommand,
					   random: () => number): ApplyActionResult {
	const failure =
		validateCurrentPlayerAction(state, command.playerId, ACTION.DRAW_DECK);
	if (failure !== null) {
		return failure;
	}
	assertNoPendingCard(state);
	refillDrawPileIfNeeded(state, random);
	state.pendingCard = takeTopCard(state.deck);
	state.pendingCardSource = CARD_SOURCE.DECK;
	state.turnStage = TURN_STAGE.DRAWN_FROM_DECK;
	state.version++;
	return succeed(state);
}

function applyDrawDiscard(state: GameState, command: DrawDiscardCommand):
	ApplyActionResult {
	const failure = validateCurrentPlayerAction(state, command.playerId,
												ACTION.DRAW_DISCARD);
	if (failure !== null) {
		return failure;
	}
	assertNoPendingCard(state);
	if (state.discardPile.length === 0) {
		throw new Error("Invalid GameState: can't draw from an empty discard \
pile");
	}
	state.pendingCard = takeTopCard(state.discardPile);
	state.pendingCardSource = CARD_SOURCE.DISCARD;
	state.turnStage = TURN_STAGE.MUST_SWAP_DISCARD;
	state.version++;
	return succeed(state);
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
			return applyDrawDeck(state, command, random);
		case ACTION.DRAW_DISCARD:
			return applyDrawDiscard(state, command);
		case ACTION.SWAP_CARD:
			return applySwapCard(state, command);
		case ACTION.DISCARD_DRAWN_CARD:
		case ACTION.REVEAL_CARD:
			throw new Error("Action not implemented");
		default:
			return fail(ERROR_CODE.UNKNOWN_ACTION);
	}
}

function completeRegularTurn(state: GameState, player: PlayerState): void {
	if (state.roundFinisherId !== null || state.finalTurnQueue.length !== 0) {
		throw new Error("Invalid GameState: regular turn completion called \
during final turn");
	}
	if (!hasHiddenCards(player)) {
		state.roundFinisherId = player.id;
		state.finalTurnQueue = buildFinalTurnQueue(state.players, player.id);
		const nextPlayerId = state.finalTurnQueue[0];
		if (nextPlayerId === undefined) {
			throw new Error("Invalid GameState: final turn queue is empty \
after a finisher");
		}
		state.currentPlayerId = nextPlayerId;
	}
	else {
		state.currentPlayerId = getNextPlayerId(state.players, player.id);
	}
	state.turnStage = TURN_STAGE.WAITING_FOR_DRAW;
}

function applySwapCard(state: GameState, command: SwapCardCommand):
	ApplyActionResult {
	const failure = validateCurrentPlayerAction(state,
												command.playerId,
												ACTION.SWAP_CARD);
	if (failure !== null) {
		return failure;
	}
	if (state.pendingCard === null || state.pendingCardSource === null) {
		throw new Error("Invalid GameState: SWAP_CARD requires a pending card");
	}
	if (state.turnStage === TURN_STAGE.DRAWN_FROM_DECK
		&& state.pendingCardSource !== CARD_SOURCE.DECK) {
			throw new Error("Invalid GameState: DRAWN_FROM_DECK requires a \
pending deck card");
	}
	if (state.turnStage === TURN_STAGE.MUST_SWAP_DISCARD
		&& state.pendingCardSource !== CARD_SOURCE.DISCARD) {
			throw new Error("Invalid GameState: MUST_SWAP_DISCARD requires a \
pending discard card");
	}
	if (!isValidBoardPosition(command.position)) {
		return fail(ERROR_CODE.INVALID_POSITION);
	}
	const player = state.players.find(
		(candidate) => candidate.id === command.playerId);
	if (player === undefined) {
		throw new Error("Invalid GameState: validated current player can't be \
found");
	}
	const targetSlot = player.board[command.position];
	if (targetSlot === undefined) {
		throw new Error("Invalid GameState: player board is missing an \
expected position");
	}
	if (targetSlot === null) {
		return fail(ERROR_CODE.INVALID_POSITION);
	}
	const pendingCard = state.pendingCard;
	const replacedCard = targetSlot.card;
	state.discardPile.push(replacedCard);
	player.board[command.position] = { card: pendingCard, revealed: true };
	state.pendingCard = null;
	state.pendingCardSource = null;
	removeCompletedColumnAtPosition(player,
									command.position,
									state.discardPile);
	completeRegularTurn(state, player);
	state.version++;
	return succeed(state);
}
