import {
	ACTION,
	BOARD_SIZE,
	CARD_SOURCE,
	ERROR_CODE,
	PHASE,
	TURN_STAGE,
} from "./constants";

import type {
	ApplyActionResult,
	BoardSlot,
	Card,
	CreateGameInput,
	DiscardDrawnCardCommand,
	DrawDeckCommand,
	DrawDiscardCommand,
	EngineSuccess,
	EngineFailure,
	GameCommand,
	GameState,
	PlayerId,
	PlayerState,
	RevealCardCommand,
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
	getCreateGameInputError,
} from "./createInputValidation";

import {
	getAllowedActionTypes,
} from "./stateMachine";

import {
	isValidBoardPosition,
	removeCompletedColumnAtPosition,
	removeAllCompletedColumns,
	revealAllCards,
} from "./board";

import {
	buildFinalTurnQueue,
	getNextPlayerId,
	hasHiddenCards,
} from "./turn";

import {
	buildRoundResult,
} from "./scoring";




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
		const starterId = chooseInitialStartingPlayer(state, random);
		state.roundStarterId = starterId;
		state.currentPlayerId = starterId;
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

/*
 * Deal a new deck of 150 cards.
 *
 * Modify only the provided player tables.
 * Do not change their IDs or cumulative scores.
 *
 * @param random A random number generator that returns a number in the range [0, 1).
*/
function dealNewRound(players: PlayerState[], random: () => number):
{ deck: Card[]; discardPile: Card[] } {
	const deck = shuffleDeck(createDeck(), random);
	for (const player of players) {
		const board: BoardSlot[] = [];
		for (let position = 0; position < BOARD_SIZE; position++) {
			const card = takeTopCard(deck);
			board.push({ card, revealed: false });
		}
		player.board = board;
	}
	return { deck, discardPile: [takeTopCard(deck)] };
}

export function createGame(input: CreateGameInput,
						   random: () => number = Math.random): GameState {
	const inputError = getCreateGameInputError(input);
	if (inputError !== null) {
	    throw new Error(inputError);
	}

	const targetScore = input.targetScore ?? 100;
	const players: PlayerState[] = input.players.map((player) =>
													 ({ id: player.id,
													  board: [],
													  totalScore: 0 }));
	const { deck, discardPile } = dealNewRound(players, random);
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
		targetScore,
		roundStarterId: null,
		roundHistory: [],
		winnerIds: [],
	};
	return gameState;
}

export function startNextRound(oldState: GameState,
							   random: () => number = Math.random): GameState {
	if (oldState.phase !== PHASE.ROUND_FINISHED) {
		throw new Error("Invalid GameState: a new round requires \
ROUND_FINISHED");
	}
	if (!Number.isSafeInteger(oldState.roundNumber)
	|| oldState.roundNumber < 1
	|| oldState.roundNumber === Number.MAX_SAFE_INTEGER) {
		throw new Error("Invalid GameState: invalid round number for next \
round");
	}
	if (!Number.isSafeInteger(oldState.version)
	|| oldState.version < 0
	|| oldState.version === Number.MAX_SAFE_INTEGER) {
		throw new Error("Invalid GameState: invalid version for next round");
	}
	const lastRound = oldState.roundHistory.at(-1);
	const finisherId = oldState.roundFinisherId;
	if (finisherId === null
	|| !oldState.players.some((player) => player.id === finisherId)
	|| lastRound === undefined
	|| lastRound.roundNumber !== oldState.roundNumber
	|| lastRound.finisherId !== finisherId
	|| lastRound.starterId !== oldState.roundStarterId
	|| oldState.roundHistory.length !== oldState.roundNumber) {
		throw new Error("Invalid GameState: previous round result is \
inconsistent");
	}
	if (oldState.currentPlayerId !== null
	|| oldState.turnStage !== null
	|| oldState.pendingCard !== null
	|| oldState.pendingCardSource !== null
	|| oldState.finalTurnQueue.length !== 0
	|| oldState.winnerIds.length !== 0) {
		throw new Error("Invalid GameState: previous round is not fully resolved");
	}
	const state = structuredClone(oldState);
	const { deck, discardPile } = dealNewRound(state.players, random);
	state.deck = deck;
	state.discardPile = discardPile;
	state.roundNumber++;
	state.roundStarterId = finisherId;
	state.roundFinisherId = null;
	state.currentPlayerId = finisherId;
	state.turnStage = TURN_STAGE.WAITING_FOR_DRAW;
	state.phase = PHASE.PLAYING;
	state.version++;
	return state;
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
			return applyDiscardDrawnCard(state, command);
		case ACTION.REVEAL_CARD:
			return applyRevealCard(state,command);
		default:
			return fail(ERROR_CODE.UNKNOWN_ACTION);
	}
}

function determineWinnerIds(players: readonly PlayerState[]): PlayerId[] {
	let lowestScore = Number.POSITIVE_INFINITY;
	const winnerIds: PlayerId[] = [];
	for (const player of players) {
		if (!Number.isFinite(player.totalScore)) {
			throw new Error("Invalid GameState: player has a non-finite total \
score");
		}
		if (player.totalScore < lowestScore) {
			lowestScore = player.totalScore;
			winnerIds.length = 0;
			winnerIds.push(player.id);
		}
		else if (player.totalScore === lowestScore) {
			winnerIds.push(player.id);
		}
	}
	if (winnerIds.length === 0) {
		throw new Error("Invalid GameState: can't determine game winner");
	}
	return winnerIds;
}

function resolveFinishedRound(state: GameState): void {
	if (state.phase !== PHASE.PLAYING) {
		throw new Error("Invalid GameState: only a playing round can be \
resolved");
	}
	if (state.roundStarterId === null) {
		throw new Error("Invalid GameState: finished round has no starter");
	}
	if (state.roundFinisherId === null) {
		throw new Error("Invalid GameState: finished round has no finisher");
	}
	if (state.finalTurnQueue.length !== 0) {
		throw new Error("Invalid GameState: final turns remain before round \
resolution");
	}
	if (state.pendingCard !== null || state.pendingCardSource !== null) {
		throw new Error("Invalid GameState: round resolution requires no \
pending card");
	}

	for (const player of state.players) {
		revealAllCards(player);
	}

	for (const player of state.players) {
		removeAllCompletedColumns(player, state.discardPile);
	}

	const roundResult = buildRoundResult(state.players,
											state.roundNumber,
											state.roundStarterId,
											state.roundFinisherId);

	for (const score of roundResult.scores) {
		const player =
			state.players.find((candidate) => candidate.id === score.playerId);
		if (player === undefined) {
			throw new Error("Invalid GameState: scored player doesn't exist");
		}
		player.totalScore += score.finalScore;
	}

	state.roundHistory.push(roundResult);

	state.currentPlayerId = null;
	state.turnStage = null;

	if (state.players.some((player) =>
						   player.totalScore >= state.targetScore)) {
		state.winnerIds = determineWinnerIds(state.players);
		state.phase = PHASE.GAME_OVER;
		return;
	}
	state.phase = PHASE.ROUND_FINISHED;
}

function completeTurn(state: GameState, player: PlayerState): void {
	// CASE 1: No player has finished their board yet
	if (state.roundFinisherId === null) {
		if (state.finalTurnQueue.length !== 0) {
			throw new Error("Invalid GameState: final turn queue exists \
without a finisher");
		}
		if (!hasHiddenCards(player)) {
			state.roundFinisherId = player.id;
			state.finalTurnQueue = buildFinalTurnQueue(state.players,
													   player.id);
			const nextPlayerId = state.finalTurnQueue[0];
			if (nextPlayerId === undefined) {
				throw new Error("Invalid GameState: final turn queue is empty \
after a finisher");
			}
			state.currentPlayerId = nextPlayerId;
			state.turnStage = TURN_STAGE.WAITING_FOR_DRAW;
			return;
		}

		state.currentPlayerId = getNextPlayerId(state.players, player.id);
		state.turnStage = TURN_STAGE.WAITING_FOR_DRAW;
		return;
	}

	// CASE 2: A finisher already exists
	const expectedPlayerId = state.finalTurnQueue[0];
	if (expectedPlayerId === undefined) {
		throw new Error("Invalid GameState: final turn queue is empty before a \
final turn");
	}
	if (expectedPlayerId !== player.id) {
		throw new Error("Invalid GameState: final turn doesn't match the \
queue");
	}
	state.finalTurnQueue.shift();
	if (state.finalTurnQueue.length === 0) {
		resolveFinishedRound(state);
		return;
	}
	const nextPlayerId = state.finalTurnQueue[0];
	if (nextPlayerId === undefined) {
		throw new Error("Invalid GameState: final turn queue has an invalid \
next player");
	}
	state.currentPlayerId = nextPlayerId;
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
	completeTurn(state, player);
	state.version++;
	return succeed(state);
}

function applyDiscardDrawnCard(state: GameState,
							   command: DiscardDrawnCardCommand):
															ApplyActionResult {
	const failure = validateCurrentPlayerAction(state,
												command.playerId,
												ACTION.DISCARD_DRAWN_CARD);
	if (failure !== null) {
		return failure;
	}
	if (state.pendingCard === null || state.pendingCardSource === null) {
		throw new Error("Invalid GameState: DISCARD_DRAWN_CARD requires a \
pending card");
	}
	if (state.pendingCardSource !== CARD_SOURCE.DECK) {
		throw new Error("Invalid GameState: DISCARD_DRAWN_CARD requires a \
pending deck card");
	}
	const player =
		state.players.find((candidate) => candidate.id === command.playerId);
	if (player === undefined) {
		throw new Error("Invalid GameState: validate current player can't be \
found");
	}
	if (!hasHiddenCards(player)) {
		throw new Error("Invalid GameState: DISCARD_DRAWN_CARD requires a \
hidden card to reveal");
	}
	state.discardPile.push(state.pendingCard);
	state.pendingCard = null;
	state.pendingCardSource = null;
	state.turnStage = TURN_STAGE.MUST_REVEAL_CARD;
	state.version++;
	return succeed(state);
}

function applyRevealCard(state: GameState, command: RevealCardCommand):
	ApplyActionResult {
	const failure = validateCurrentPlayerAction(state,
												command.playerId,
												ACTION.REVEAL_CARD);
	if (failure !== null) {
		return failure;
	}
	if (state.pendingCard !== null || state.pendingCardSource !== null) {
		throw new Error("Invalid GameState: MUST_REVEAL_CARD requires no \
pending card");
	}
	if (!isValidBoardPosition(command.position)) {
		return fail(ERROR_CODE.INVALID_POSITION);
	}
	const player =
		state.players.find((candidate) => candidate.id === command.playerId);
	if (player === undefined) {
		throw new Error("Invalid GameState: validate current player can't be \
found");
	}
	const slot = player.board[command.position];
	if (slot === undefined) {
		throw new Error("Invalid GameState: player board is missing an \
expected position");}
	if (slot === null) {
		return fail(ERROR_CODE.INVALID_POSITION);
	}
	if (slot.revealed) {
		return fail(ERROR_CODE.CARD_NOT_HIDDEN);
	}
	slot.revealed = true;
	removeCompletedColumnAtPosition(player,
									command.position,
									state.discardPile);
	completeTurn(state, player);
	state.version++;
	return succeed(state);
}
