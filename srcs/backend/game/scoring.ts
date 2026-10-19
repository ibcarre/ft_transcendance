import {
	BOARD_SIZE,
	MAX_PLAYERS,
	MIN_PLAYERS,
} from "./constants";

import type {
	PlayerId,
	PlayerState,
	RoundPlayerScore,
	RoundResult,
} from "./types";

export function calculateBoardScore(player: PlayerState): number {
	if (player.board.length !== BOARD_SIZE) {
		throw new Error("Invalid GameState: can't score a board with an \
invalid size");
	}
	let score = 0;
	for (const slot of player.board) {
		if (slot === undefined) {
			throw new Error("Invalid GameState: can't score a missing board \
position");
		}
		if (slot === null) {
			continue;
		}
		if (!slot.revealed) {
			throw new Error("Invalid GameState: can't score a hidden card");
		}
		score += slot.card.value;
	}
	return score;
}

export function calculateFinisherScore(finisherBaseScore: number,
									   otherBaseScores: readonly number[]):
										number {
	if (otherBaseScores.length === 0) {
		throw new Error("Invalid GameState: the finisher must have opponents");
	}
	if (finisherBaseScore <= 0) {
		return finisherBaseScore;
	}
	for (const otherScore of otherBaseScores) {
		if (otherScore <= finisherBaseScore) {
			return finisherBaseScore * 2;
		}
	}
	return finisherBaseScore;
}

export function buildRoundResult(players: readonly PlayerState[],
								 roundNumber: number, starterId: PlayerId,
								 finisherId: PlayerId): RoundResult {
	if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
		throw new Error("Invalid GameState: invalid number of players for \
scoring");
	}
	if (!Number.isSafeInteger(roundNumber) || roundNumber <= 0) {
		throw new Error("Invalid GameState: invalid round number for scoring");
	}
	const seenIds = new Set<PlayerId>();
	const scores: RoundPlayerScore[] = [];
	let starterExists = false;
	let finisherScore: RoundPlayerScore | null = null;
	for (const player of players) {
		if (seenIds.has(player.id)) {
			throw new Error("Invalid GameState: duplicate player ID during \
scoring");
		}
		seenIds.add(player.id);
		const baseScore = calculateBoardScore(player);
		const playerScore: RoundPlayerScore = { playerId: player.id, baseScore,
												finalScore: baseScore };
		scores.push(playerScore);
		if (player.id === starterId) {
			starterExists = true;
		}
		if (player.id === finisherId) {
			finisherScore = playerScore;
		}
	}
	if (!starterExists) {
		throw new Error("Invalid GameState: round starter doesn't exist");
	}
	if (finisherScore === null) {
		throw new Error("Invalid GameState: round finisher doesn't exist");
	}
	const otherBaseScores: number[] = [];
	for (const score of scores) {
		if (score.playerId !== finisherId) {
			otherBaseScores.push(score.baseScore);
		}
	}
	finisherScore.finalScore = calculateFinisherScore(finisherScore.baseScore,
													  otherBaseScores);
	return { roundNumber, starterId, finisherId, scores };
}
