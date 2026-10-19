import test from "node:test";
import assert from "node:assert/strict";

import {
	ACTION,
	ERROR_CODE,
	PHASE,
	TURN_STAGE,
	applyAction,
	buildPublicState,
	createGame,
	startNextRound,
} from "../index";

import type {
	ApplyActionResult,
	BoardSlot,
	GameCommand,
	GameState,
	PlayerId,
} from "../types";

const PLAYER_IDS = ["player-a", "player-b", "player-c", "player-d"];

function act(state: GameState, command: GameCommand): GameState {
	const result: ApplyActionResult = applyAction(state, command);
	if (!result.ok) {
		throw new Error(`Unexpected action failure: ${result.error.code}`);
	}
	return result.state;
}

function createPlayingGame(playerCount: number, targetScore: number): GameState {
	let state = createGame({
		id: "next-round-test",
		players: PLAYER_IDS.slice(0, playerCount).map((id) => ({ id })),
		targetScore,
	}, () => 0.5);
	for (const player of state.players) {
		state = act(state, {
			type: ACTION.REVEAL_INITIAL_CARD,
			playerId: player.id,
			position: 0,
		});
		state = act(state, {
			type: ACTION.REVEAL_INITIAL_CARD,
			playerId: player.id,
			position: 1,
		});
	}
	assert.equal(state.phase, PHASE.PLAYING);
	return state;
}

/** Exercise the real action handler and final-turn queue. */
function finishRound(playingState: GameState): GameState {
	let state = playingState;
	assert.equal(state.phase, PHASE.PLAYING);
	assert.equal(state.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
	assert.equal(state.roundFinisherId, null);
	const finisherId = state.currentPlayerId;
	assert.ok(finisherId);

	// Set up a board that is one ordinary swap away from finishing, without
	// touching the card identities or values used by the real deck.
	const finisher = state.players.find((player) => player.id === finisherId);
	assert.ok(finisher);
	for (let index = 0; index < finisher.board.length; index++) {
		const slot: BoardSlot | undefined = finisher.board[index];
		assert.ok(slot);
		slot.revealed = index !== 11;
	}
	state = act(state, { type: ACTION.DRAW_DISCARD, playerId: finisherId });
	state = act(state, {
		type: ACTION.SWAP_CARD,
		playerId: finisherId,
		position: 11,
	});
	assert.equal(state.roundFinisherId, finisherId);

	while (state.phase === PHASE.PLAYING) {
		const playerId = state.currentPlayerId;
		assert.ok(playerId);
		assert.notEqual(playerId, finisherId);
		state = act(state, { type: ACTION.DRAW_DISCARD, playerId });
		state = act(state, {
			type: ACTION.SWAP_CARD,
			playerId,
			position: 0,
		});
	}
	assert.equal(state.roundHistory.at(-1)?.finisherId, finisherId);
	return state;
}

function createFinishedGame(playerCount = 2, targetScore = 1000): GameState {
	return finishRound(createPlayingGame(playerCount, targetScore));
}

function assertFreshRoundCards(state: GameState): void {
	const cards = [...state.deck, ...state.discardPile];
	for (const player of state.players) {
		assert.equal(player.board.length, 12);
		for (const slot of player.board) {
			assert.ok(slot);
			assert.equal(slot.revealed, false);
			cards.push(slot.card);
		}
	}
	assert.equal(state.deck.length, 150 - 12 * state.players.length - 1);
	assert.equal(state.discardPile.length, 1);
	assert.equal(cards.length, 150);
	assert.equal(new Set(cards.map((card) => card.id)).size, 150);
	assert.equal(state.pendingCard, null);
	assert.equal(state.pendingCardSource, null);
}

test("startNextRound() deals new hidden boards and a complete deck for 2/3/4 players",
() => {
	for (const count of [2, 3, 4]) {
		const finished = createFinishedGame(count);
		assert.equal(finished.phase, PHASE.ROUND_FINISHED);
		const next = startNextRound(finished, () => 0.5);
		assertFreshRoundCards(next);
		assert.deepEqual(next.players.map((player) => player.id),
							 finished.players.map((player) => player.id));
	}
});

test("the previous finisher starts round 2 directly without initial reveal",
() => {
	const finished = createFinishedGame(4);
	const finisherId = finished.roundFinisherId;
	assert.ok(finisherId);
	const next = startNextRound(finished, () => 0.5);

	assert.equal(next.phase, PHASE.PLAYING);
	assert.equal(next.roundNumber, 2);
	assert.equal(next.roundStarterId, finisherId);
	assert.equal(next.currentPlayerId, finisherId);
	assert.equal(next.roundFinisherId, null);
	assert.deepEqual(next.finalTurnQueue, []);
	assert.equal(next.turnStage, TURN_STAGE.WAITING_FOR_DRAW);
	assert.deepEqual(next.winnerIds, []);

	const rejected = applyAction(next, {
		type: ACTION.REVEAL_INITIAL_CARD,
		playerId: finisherId,
		position: 0,
	});
	assert.equal(rejected.ok, false);
	if (!rejected.ok) {
		assert.equal(rejected.error.code, ERROR_CODE.ACTION_NOT_ALLOWED);
	}
	const drawn = act(next, { type: ACTION.DRAW_DECK, playerId: finisherId });
	assert.equal(drawn.turnStage, TURN_STAGE.DRAWN_FROM_DECK);
	assert.equal(drawn.currentPlayerId, finisherId);
});

test("round history, cumulative scores, threshold and player order survive redealing",
() => {
	const finished = createFinishedGame(3);
	const history = structuredClone(finished.roundHistory);
	const scores = finished.players.map((player) => player.totalScore);
	const next = startNextRound(finished, () => 0.5);

	assert.deepEqual(next.roundHistory, history);
	assert.notStrictEqual(next.roundHistory, finished.roundHistory);
	assert.deepEqual(next.players.map((player) => player.totalScore), scores);
	assert.equal(next.targetScore, 1000);
	assert.equal(next.id, finished.id);
});

test("startNextRound() clones the input and increments version only once", () => {
	const finished = createFinishedGame();
	const snapshot = structuredClone(finished);
	const next = startNextRound(finished, () => 0.5);

	assert.deepEqual(finished, snapshot);
	assert.notStrictEqual(next, finished);
	assert.notStrictEqual(next.players, finished.players);
	assert.equal(next.version, finished.version + 1);
	assert.equal(next.roundNumber, finished.roundNumber + 1);
});

test("public state of round 2 hides new cards and retains round 1 scores", () => {
	const finished = createFinishedGame();
	const next = startNextRound(finished, () => 0.5);
	const visible = buildPublicState(next);

	assert.equal(visible.phase, PHASE.PLAYING);
	assert.equal(visible.roundNumber, 2);
	assert.equal(visible.roundStarterId, finished.roundFinisherId);
	assert.equal(visible.currentPlayerId, finished.roundFinisherId);
	assert.equal(visible.deckCount, 125);
	assert.equal(visible.discardTop, next.discardPile[0]?.value);
	assert.deepEqual(visible.roundHistory, finished.roundHistory);
	assert.deepEqual(visible.winnerIds, []);
	assert.equal(visible.pendingCard, null);
	for (const player of visible.players) {
		assert.ok(player.board.every((slot) => slot.status === "hidden"));
	}
});

test("multiple rounds work: each preceding finisher starts the next", () => {
	let state = createPlayingGame(3, 1000);
	for (let round = 1; round <= 3; round++) {
		const expectedStarter = state.currentPlayerId;
		state = finishRound(state);
		assert.equal(state.phase, PHASE.ROUND_FINISHED);
		assert.equal(state.roundHistory.length, round);
		assert.equal(state.roundHistory.at(-1)?.roundNumber, round);
		assert.equal(state.roundHistory.at(-1)?.finisherId, expectedStarter);
		if (round < 3) {
			const previousTotals = state.players.map((player) => player.totalScore);
			state = startNextRound(state, () => 0.5);
			assert.equal(state.roundNumber, round + 1);
			assert.equal(state.roundStarterId, expectedStarter);
			assert.equal(state.currentPlayerId, expectedStarter);
			assert.deepEqual(state.players.map((player) => player.totalScore),
							 previousTotals);
			assertFreshRoundCards(state);
		}
	}
	for (const player of state.players) {
		const historicalTotal = state.roundHistory.reduce((sum, round) => {
			const score = round.scores.find((score) => score.playerId === player.id);
			assert.ok(score);
			return sum + score.finalScore;
		}, 0);
		assert.equal(player.totalScore, historicalTotal);
	}
});

test("cannot start the next round twice or while the current round is running",
() => {
	const initial = createGame({
		id: "invalid-transition",
		players: [{ id: "a" }, { id: "b" }],
	});
	const playing = createPlayingGame(2, 1000);
	const finished = finishRound(playing);
	const next = startNextRound(finished, () => 0.5);

	for (const invalid of [initial, playing, next]) {
		const snapshot = structuredClone(invalid);
		assert.throws(() => startNextRound(invalid, () => 0.5),
			{ message: "Invalid GameState: a new round requires ROUND_FINISHED" });
		assert.deepEqual(invalid, snapshot);
	}
});

test("GAME_OVER is terminal and cannot be restarted", () => {
	const gameOver = createFinishedGame(2, 1);
	assert.equal(gameOver.phase, PHASE.GAME_OVER);
	assert.ok(gameOver.winnerIds.length > 0);
	assert.throws(() => startNextRound(gameOver, () => 0.5),
		{ message: "Invalid GameState: a new round requires ROUND_FINISHED" });
});

test("rejects a ROUND_FINISHED state without a valid recorded finisher", () => {
	const finished = createFinishedGame();
	for (const change of [
		(state: GameState) => { state.roundFinisherId = null; },
		(state: GameState) => { state.roundFinisherId = "missing"; },
		(state: GameState) => { state.roundHistory = []; },
		(state: GameState) => { state.roundHistory[0]!.finisherId = "missing"; },
		(state: GameState) => { state.roundHistory[0]!.roundNumber = 7; },
	]) {
		const bad = structuredClone(finished);
		change(bad);
		const before = structuredClone(bad);
		assert.throws(() => startNextRound(bad, () => 0.5),
			{ message: "Invalid GameState: previous round result is inconsistent" });
		assert.deepEqual(bad, before);
	}
});

test("rejects an unfinished turn or contradictory terminal fields", () => {
	const finished = createFinishedGame();
	for (const change of [
		(state: GameState) => { state.currentPlayerId = "player-a"; },
		(state: GameState) => { state.turnStage = TURN_STAGE.WAITING_FOR_DRAW; },
		(state: GameState) => { state.pendingCard = { id: 999, value: 3 }; },
		(state: GameState) => { state.pendingCardSource = "DECK"; },
		(state: GameState) => { state.finalTurnQueue.push("player-a"); },
		(state: GameState) => { state.winnerIds.push("player-a"); },
	]) {
		const bad = structuredClone(finished);
		change(bad);
		assert.throws(() => startNextRound(bad, () => 0.5),
			{ message: "Invalid GameState: previous round is not fully resolved" });
	}
});

test("rejects exhausted round numbers and versions instead of overflowing", () => {
	const finished = createFinishedGame();
	finished.roundNumber = Number.MAX_SAFE_INTEGER;
	assert.throws(() => startNextRound(finished),
		{ message: "Invalid GameState: invalid round number for next round" });
	finished.roundNumber = 1;
	finished.version = Number.MAX_SAFE_INTEGER;
	assert.throws(() => startNextRound(finished),
		{ message: "Invalid GameState: invalid version for next round" });
});

test("injected randomness permits deterministic repeatable dealing", () => {
	const finished = createFinishedGame();
	const a = startNextRound(finished, () => 0.5);
	const b = startNextRound(finished, () => 0.5);
	assert.deepEqual(a, b);
	const different = startNextRound(finished, () => 0.1);
	assert.notDeepEqual(a.deck.map((card) => card.id),
						different.deck.map((card) => card.id));
});
