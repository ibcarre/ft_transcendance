import type {
    BoardSlot,
    GameState,
    PlayerState,
    PublicBoardCard,
    PublicGameState,
    PublicPendingCard,
    PublicPlayerState,
} from "./types";


function buildPublicBoardCard(slot: BoardSlot): PublicBoardCard {
	if (slot === null) {
		return { status: "removed" };
	}
	if (!slot.revealed) {
		return { status: "hidden" };
	}
	return { status: "revealed", value: slot.card.value };
}

function buildPublicPlayer(player: PlayerState): PublicPlayerState {
	return {
		id: player.id,
		board: player.board.map((slot) => buildPublicBoardCard(slot)),
		totalScore: player.totalScore,
	}
}

function buildPublicPendingCard(state: GameState): PublicPendingCard | null {
	if (state.pendingCard === null && state.pendingCardSource === null) {
		return null;
	}
	if (state.pendingCard === null || state.pendingCardSource === null) {
		throw new Error("Invalid GameState: inconsistent pending card state");
	}
	return { source: state.pendingCardSource, value: state.pendingCard.value };
}

export function buildPublicState(state: GameState): PublicGameState {
	const discardTop = state.discardPile.at(-1);
	return {
		id: state.id,
		players: state.players.map((player) => buildPublicPlayer(player)),
		phase: state.phase,
		turnStage: state.turnStage,
		currentPlayerId: state.currentPlayerId,
		roundNumber: state.roundNumber,
		deckCount: state.deck.length,
		discardTop: discardTop?.value ?? null,
		pendingCard: buildPublicPendingCard(state),
		version: state.version,
	};
}
