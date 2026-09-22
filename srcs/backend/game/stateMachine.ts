import {
    ACTION,
    PHASE,
    TURN_STAGE,
} from "./constants";

import type {
    ActionType,
} from "./constants";

import type {
    GameState,
} from "./types";


export function getAllowedActionTypes(
    state: GameState
): ActionType[] {

    if (state.phase === PHASE.GAME_OVER)
		{ return []; }


    if (state.phase === PHASE.INITIAL_REVEAL)
		{ return [ACTION.REVEAL_INITIAL_CARD,]; }


    if (state.phase !== PHASE.PLAYING)
		{ return []; }


    switch (state.turnStage) {

        case TURN_STAGE.WAITING_FOR_DRAW:
            return [
				ACTION.DRAW_DECK,
				ACTION.DRAW_DISCARD,
            ];

        case TURN_STAGE.DRAWN_FROM_DECK:
            return [
                ACTION.SWAP_CARD,
                ACTION.DISCARD_DRAWN_CARD,
            ];

        case TURN_STAGE.MUST_SWAP_DISCARD:
            return [
                ACTION.SWAP_CARD,
            ];

        case TURN_STAGE.MUST_REVEAL_CARD:
            return [
                ACTION.REVEAL_CARD,
            ];

        default:
            return [];
    }
}
