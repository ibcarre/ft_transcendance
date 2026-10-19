import test from "node:test";
import assert from "node:assert/strict";

import {
	applyAction,
	createGame,
} from "../index";

import {
	ACTION,
	ERROR_CODE,
	PHASE,
	TURN_STAGE,
} from "../constants";

import type {
	ApplyActionResult,
	BoardSlot,
	CardValue,
	GameState,
	PlayerId,
	PlayerState,
} from "../types";

const PLAYER_IDS = ["user-1", "user-2", "user-3", "user-4"];

function expectSuccess(result: ApplyActionResult): GameState {
	if (!result.ok) {
		throw new Error(`Expected action to succeed, got ${result.error.code}`);
	}
	return result.state;
}

function revealInitialCard(state: GameState, playerId: PlayerId,
						   position: number): GameState {
	return expectSuccess(applyAction(state, {
		type: ACTION.REVEAL_INITIAL_CARD,
		playerId,
		position,
	}));
}

function createPlayingGame(playerCount = 2, targetScore = 1000): GameState {
	const playerInputs = PLAYER_IDS
		.slice(0, playerCount)
		.map((id) => ({ id }));
	let state = createGame({
		id: "round-resolution-test",
		players: playerInputs,
		targetScore,
	}, () => 0.5);

	const boardValues: CardValue[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
	for (const player of state.players) {
		for (let position = 0; position < boardValues.length; position++) {
			const slot = player.board[position];
			assert.ok(slot);
			slot.card.value = boardValues[position]!;
		}
		const firstCard = player.board[0];
		const secondCard = player.board[1];
		assert.ok(firstCard);
		assert.ok(secondCard);
		if (player.id === "user-1") {
			firstCard.card.value = 12;
			secondCard.card.value = 12;
		}
		else {
			firstCard.card.value = -2;
			secondCard.card.value = -2;
		}
	}

	for (const player of state.players) {
		state = revealInitialCard(state, player.id, 0);
		state = revealInitialCard(state, player.id, 1);
	}

	assert.equal(state.phase, PHASE.PLAYING);
	assert.equal(state.currentPlayerId, "user-1");
	assert.equal(state.roundStarterId, "user-1");
	assert.equal(state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
	return state;
}

function makePlayerFinisher(state: GameState, playerId: PlayerId,
						   pendingValue: CardValue = 1): GameState {
	const player = state.players.find((candidate) => candidate.id === playerId);
	assert.ok(player);
	for (let position = 0; position < player.board.length; position++) {
		const slot: BoardSlot | undefined = player.board[position];
		assert.ok(slot);
		slot.revealed = position !== 11;
	}

	const drawn = expectSuccess(applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId,
	}));
	assert.ok(drawn.pendingCard);
	drawn.pendingCard.value = pendingValue;
	const finishedTurn = expectSuccess(applyAction(drawn, {
		type: ACTION.SWAP_CARD,
		playerId,
		position: 11,
	}));
	assert.equal(finishedTurn.roundFinisherId, playerId);
	return finishedTurn;
}

function makeUser1Finisher(state: GameState, pendingValue: CardValue = 1): GameState {
	return makePlayerFinisher(state, "user-1", pendingValue);
}

function makeUser1FinisherByRevealing(state: GameState): GameState {
	const player = state.players.find((candidate) => candidate.id === "user-1");
	assert.ok(player);
	for (let position = 0; position < player.board.length; position++) {
		const slot: BoardSlot | undefined = player.board[position];
		assert.ok(slot);
		slot.revealed = position !== 11;
	}

	let next = expectSuccess(applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId: "user-1",
	}));
	next = expectSuccess(applyAction(next, {
		type: ACTION.DISCARD_DRAWN_CARD,
		playerId: "user-1",
	}));
	next = expectSuccess(applyAction(next, {
		type: ACTION.REVEAL_CARD,
		playerId: "user-1",
		position: 11,
	}));
	assert.equal(next.roundFinisherId, "user-1");
	return next;
}

function completeTurnBySwapping(state: GameState,
									  playerId: PlayerId): GameState {
	const drawn = expectSuccess(applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId,
	}));
	assert.ok(drawn.pendingCard);
	drawn.pendingCard.value = 1;
	return expectSuccess(applyAction(drawn, {
		type: ACTION.SWAP_CARD,
		playerId,
		position: 2,
	}));
}

function completeTurnByRevealing(state: GameState,
								   playerId: PlayerId): GameState {
	let next = expectSuccess(applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId,
	}));
	next = expectSuccess(applyAction(next, {
		type: ACTION.DISCARD_DRAWN_CARD,
		playerId,
	}));
	return expectSuccess(applyAction(next, {
		type: ACTION.REVEAL_CARD,
		playerId,
		position: 2,
	}));
}

function getPlayer(state: GameState, playerId: PlayerId): PlayerState {
	const player = state.players.find((candidate) => candidate.id === playerId);
	assert.ok(player);
	return player;
}

function assertAllRemainingCardsRevealed(state: GameState): void {
	for (const player of state.players) {
		for (const slot of player.board) {
			if (slot !== null) {
				assert.equal(slot.revealed, true);
			}
		}
	}
}

function assertAllCardIdsPreserved(state: GameState): void {
	const cards = [...state.deck, ...state.discardPile];
	for (const player of state.players) {
		for (const slot of player.board) {
			if (slot !== null) {
				cards.push(slot.card);
			}
		}
	}
	if (state.pendingCard !== null) {
		cards.push(state.pendingCard);
	}
	assert.equal(cards.length, 150);
	assert.equal(new Set(cards.map((card) => card.id)).size, 150);
}

test("the finisher cannot play again and every opponent is queued in turn order",
() => {
	let state = createPlayingGame(4);
	state = makeUser1Finisher(state);

	assert.equal(state.phase, PHASE.PLAYING);
	assert.equal(state.roundFinisherId, "user-1");
	assert.deepEqual(state.finalTurnQueue, ["user-2", "user-3", "user-4"]);
	assert.equal(state.currentPlayerId, "user-2");
	assert.equal(state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
	assert.deepEqual(state.roundHistory, []);
	assert.deepEqual(state.players.map((player) => player.totalScore), [0, 0, 0, 0]);

	const previousState = structuredClone(state);
	const rejected = applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId: "user-1",
	});
	assert.equal(rejected.ok, false);
	if (!rejected.ok) {
		assert.equal(rejected.error.code, ERROR_CODE.NOT_YOUR_TURN);
	}
	assert.deepEqual(state, previousState);
});

test("the final-turn queue wraps around when a later player finishes",
() => {
	let state = createPlayingGame(4);
	state = completeTurnBySwapping(state, "user-1");
	state = completeTurnBySwapping(state, "user-2");
	assert.equal(state.currentPlayerId, "user-3");

	state = makePlayerFinisher(state, "user-3");
	assert.deepEqual(state.finalTurnQueue, ["user-4", "user-1", "user-2"]);
	assert.equal(state.currentPlayerId, "user-4");

	state = completeTurnBySwapping(state, "user-4");
	assert.deepEqual(state.finalTurnQueue, ["user-1", "user-2"]);
	assert.equal(state.currentPlayerId, "user-1");
	state = completeTurnBySwapping(state, "user-1");
	assert.deepEqual(state.finalTurnQueue, ["user-2"]);
	assert.equal(state.currentPlayerId, "user-2");
	state = completeTurnBySwapping(state, "user-2");

	assert.equal(state.phase, PHASE.ROUND_FINISHED);
	assert.equal(state.roundFinisherId, "user-3");
	assert.equal(state.roundHistory.length, 1);
});

test("each opponent receives exactly one final turn before the round resolves",
() => {
	let state = createPlayingGame(4);
	state = makeUser1Finisher(state);

	state = completeTurnBySwapping(state, "user-2");
	assert.deepEqual(state.finalTurnQueue, ["user-3", "user-4"]);
	assert.equal(state.currentPlayerId, "user-3");
	assert.equal(state.phase, PHASE.PLAYING);
	assert.equal(state.roundHistory.length, 0);

	state = completeTurnBySwapping(state, "user-3");
	assert.deepEqual(state.finalTurnQueue, ["user-4"]);
	assert.equal(state.currentPlayerId, "user-4");
	assert.equal(state.phase, PHASE.PLAYING);
	assert.equal(state.roundHistory.length, 0);

	state = completeTurnBySwapping(state, "user-4");
	assert.deepEqual(state.finalTurnQueue, []);
	assert.equal(state.currentPlayerId, null);
	assert.equal(state.turnStage, null);
	assert.equal(state.phase, PHASE.ROUND_FINISHED);
	assert.equal(state.roundHistory.length, 1);
});

test("REVEAL_CARD can trigger the finisher and start the final-turn queue",
() => {
	let state = createPlayingGame(3);
	state = makeUser1FinisherByRevealing(state);

	assert.equal(state.roundFinisherId, "user-1");
	assert.deepEqual(state.finalTurnQueue, ["user-2", "user-3"]);
	assert.equal(state.currentPlayerId, "user-2");
	assert.equal(state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);

	state = completeTurnBySwapping(state, "user-2");
	state = completeTurnBySwapping(state, "user-3");
	assert.equal(state.phase, PHASE.ROUND_FINISHED);
	assert.equal(state.roundHistory.length, 1);
});

test("a final reveal resolves the round and returns its complete public state",
() => {
	let state = createPlayingGame(2);
	state = makeUser1Finisher(state);
	let next = expectSuccess(applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId: "user-2",
	}));
	next = expectSuccess(applyAction(next, {
		type: ACTION.DISCARD_DRAWN_CARD,
		playerId: "user-2",
	}));
	const result = applyAction(next, {
		type: ACTION.REVEAL_CARD,
		playerId: "user-2",
		position: 2,
	});
	if (!result.ok) {
		throw new Error(`Expected final reveal to succeed, got ${result.error.code}`);
	}
	state = result.state;

	assert.equal(state.phase, PHASE.ROUND_FINISHED);
	assert.equal(state.currentPlayerId, null);
	assert.equal(state.turnStage, null);
	assert.equal(state.roundHistory.length, 1);
	assert.equal(result.publicState.phase, PHASE.ROUND_FINISHED);
	assert.deepEqual(result.publicState.roundHistory, state.roundHistory);
	assert.deepEqual(result.publicState.winnerIds, []);
	for (const player of result.publicState.players) {
		for (const slot of player.board) {
			assert.notEqual(slot.status, "hidden");
		}
	}
	assertAllRemainingCardsRevealed(state);
});

test("round resolution reveals cards, removes complete columns, then scores",
() => {
	let state = createPlayingGame(3);
	for (const playerId of ["user-2", "user-3"]) {
		const player = getPlayer(state, playerId);
		for (const position of [0, 4, 8]) {
			const slot = player.board[position];
			assert.ok(slot);
			slot.card.value = 6;
		}
	}

	state = makeUser1Finisher(state);
	state = completeTurnBySwapping(state, "user-2");
	state = completeTurnBySwapping(state, "user-3");

	assert.equal(state.phase, PHASE.ROUND_FINISHED);
	assertAllRemainingCardsRevealed(state);

	for (const playerId of ["user-2", "user-3"]) {
		const player = getPlayer(state, playerId);
		for (const position of [0, 4, 8]) {
			assert.equal(player.board[position], null);
		}
	}

	const round = state.roundHistory[0];
	assert.ok(round);
	assert.equal(round.roundNumber, 1);
	assert.equal(round.starterId, "user-1");
	assert.equal(round.finisherId, "user-1");
	assert.deepEqual(
		round.scores.map((score) => [score.playerId, score.baseScore, score.finalScore]),
		[
			["user-1", 79, 158],
			["user-2", 50, 50],
			["user-3", 50, 50],
		],
	);
	assert.equal(getPlayer(state, "user-1").totalScore, 158);
	assert.equal(getPlayer(state, "user-2").totalScore, 50);
	assert.equal(getPlayer(state, "user-3").totalScore, 50);
	assert.equal(state.discardPile.length, 10);
	assert.deepEqual(state.winnerIds, []);
	assertAllCardIdsPreserved(state);
});

test("round resolution applies the finisher penalty and records base and final scores",
() => {
	let state = createPlayingGame(2, 1000);
	state = makeUser1Finisher(state);
	state = completeTurnBySwapping(state, "user-2");

	const round = state.roundHistory[0];
	assert.ok(round);
	assert.deepEqual(
		round.scores.map((score) => [score.playerId, score.baseScore, score.finalScore]),
		[
			["user-1", 79, 158],
			["user-2", 60, 60],
		],
	);
	assert.equal(getPlayer(state, "user-1").totalScore, 158);
	assert.equal(getPlayer(state, "user-2").totalScore, 60);
	assert.equal(state.phase, PHASE.ROUND_FINISHED);
});

test("the finisher is not penalized when their score is strictly lowest",
() => {
	let state = createPlayingGame(2, 1000);
	const finisher = getPlayer(state, "user-1");
	const values: CardValue[] = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	for (let position = 0; position < values.length; position++) {
		const slot = finisher.board[position];
		assert.ok(slot);
		slot.card.value = values[position]!;
	}
	state = makeUser1Finisher(state, 10);
	state = completeTurnBySwapping(state, "user-2");

	const round = state.roundHistory[0];
	assert.ok(round);
	assert.deepEqual(
		round.scores.map((score) => [score.playerId, score.baseScore, score.finalScore]),
		[
			["user-1", 43, 43],
			["user-2", 60, 60],
		],
	);
	assert.equal(state.phase, PHASE.ROUND_FINISHED);
});

test("reaching targetScore ends the game and publicly records tied winners",
() => {
	let state = createPlayingGame(3, 100);
	state = makeUser1Finisher(state);
	state = completeTurnByRevealing(state, "user-2");
	let next = expectSuccess(applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId: "user-3",
	}));
	next = expectSuccess(applyAction(next, {
		type: ACTION.DISCARD_DRAWN_CARD,
		playerId: "user-3",
	}));
	const result = applyAction(next, {
		type: ACTION.REVEAL_CARD,
		playerId: "user-3",
		position: 2,
	});
	if (!result.ok) {
		throw new Error(`Expected final reveal to succeed, got ${result.error.code}`);
	}
	state = result.state;

	assert.equal(state.phase, PHASE.GAME_OVER);
	assert.equal(state.currentPlayerId, null);
	assert.equal(state.turnStage, null);
	assert.deepEqual(state.winnerIds, ["user-2", "user-3"]);
	assert.equal(getPlayer(state, "user-1").totalScore, 158);
	assert.equal(getPlayer(state, "user-2").totalScore, 61);
	assert.equal(getPlayer(state, "user-3").totalScore, 61);
	assert.equal(result.publicState.phase, PHASE.GAME_OVER);
	assert.deepEqual(result.publicState.winnerIds, ["user-2", "user-3"]);
	assert.deepEqual(result.publicState.roundHistory, state.roundHistory);
	for (const player of result.publicState.players) {
		for (const slot of player.board) {
			assert.notEqual(slot.status, "hidden");
		}
	}
});

test("GAME_OVER records a single winner when one player has the lowest score",
() => {
	let state = createPlayingGame(2, 100);
	state = makeUser1Finisher(state);
	state = completeTurnBySwapping(state, "user-2");

	assert.equal(state.phase, PHASE.GAME_OVER);
	assert.deepEqual(state.winnerIds, ["user-2"]);
});

test("the game ends when a cumulative score equals targetScore exactly",
() => {
	let state = createPlayingGame(2, 158);
	state = makeUser1Finisher(state);
	state = completeTurnBySwapping(state, "user-2");

	assert.equal(getPlayer(state, "user-1").totalScore, 158);
	assert.equal(state.phase, PHASE.GAME_OVER);
	assert.deepEqual(state.winnerIds, ["user-2"]);
});

test("ROUND_FINISHED rejects further player actions",
() => {
	let state = createPlayingGame(2, 1000);
	state = makeUser1Finisher(state);
	state = completeTurnBySwapping(state, "user-2");
	const previous = structuredClone(state);

	const result = applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId: "user-1",
	});
	assert.equal(result.ok, false);
	if (!result.ok) {
		assert.equal(result.error.code, ERROR_CODE.ACTION_NOT_ALLOWED);
	}
	assert.deepEqual(state, previous);
});

test("the final action increments version once despite resolving the round",
() => {
	let state = createPlayingGame(2, 1000);
	state = makeUser1Finisher(state);
	let drawn = expectSuccess(applyAction(state, {
		type: ACTION.DRAW_DECK,
		playerId: "user-2",
	}));
	drawn = expectSuccess(applyAction(drawn, {
		type: ACTION.DISCARD_DRAWN_CARD,
		playerId: "user-2",
	}));
	const versionBeforeFinalAction = drawn.version;

	const result = expectSuccess(applyAction(drawn, {
		type: ACTION.REVEAL_CARD,
		playerId: "user-2",
		position: 2,
	}));
	assert.equal(result.version, versionBeforeFinalAction + 1);
	assert.equal(result.phase, PHASE.ROUND_FINISHED);
});

test("round resolution preserves all 150 unique card identities",
() => {
	let state = createPlayingGame(3);
	state = makeUser1Finisher(state);
	state = completeTurnBySwapping(state, "user-2");
	state = completeTurnBySwapping(state, "user-3");
	assertAllCardIdsPreserved(state);
});

test("an inconsistent final-turn queue is treated as an internal error",
() => {
	let state = createPlayingGame(3);
	state = makeUser1Finisher(state);
	state.finalTurnQueue[0] = "user-3";

	assert.throws(
		() => completeTurnBySwapping(state, "user-2"),
		{ message: "Invalid GameState: final turn doesn't match the queue" },
	);
	assert.equal(state.currentPlayerId, "user-2");
	assert.deepEqual(state.finalTurnQueue, ["user-3", "user-3"]);
});
