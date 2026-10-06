import type {
	PlayerId,
	PlayerState,
} from "./types";

export function hasHiddenCards(player: PlayerState): boolean {
	for (const slot of player.board) {
		if (slot !== null && !slot.revealed) {
			return true;
		}
	}
	return false;
}

export function getNextPlayerId(players: readonly PlayerState[],
								currentPlayerId: PlayerId): PlayerId {
	let currentIndex = -1;
	for (let index = 0; index < players.length; index++) {
		const player = players[index];
		if (player !== undefined && player.id === currentPlayerId) {
			currentIndex = index;
			break;
		}
	}
	if (currentIndex === -1) {
		throw new Error("Invalid GameState: player doesn't exist in turn \
order");
	}
	const nextIndex = (currentIndex + 1) % players.length;
	const nextPlayer = players[nextIndex];
	if (nextPlayer === undefined) {
		throw new Error("Invalid GameState: turn order has no next player");
	}
	return nextPlayer.id;
}

export function buildFinalTurnQueue(players: readonly PlayerState[],
									finisherId: PlayerId): PlayerId[] {
	let finisherExists = false;
	for (const player of players) {
		if (player.id === finisherId) {
			finisherExists = true;
			break;
		}
	}
	if (!finisherExists) {
		throw new Error("Invalid GameState: finisher doesn't exist in turn \
order");
	}
	const queue: PlayerId[] = [];
	let playerId = finisherId;
	for (let count = 0; count < players.length - 1; count++) {
		playerId = getNextPlayerId(players, playerId);
		queue.push(playerId);
	}
	return queue;
}
