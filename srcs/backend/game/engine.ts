import {
    ACTION,
    ERROR_CODE,
} from "./constants";

import type {
    ApplyActionResult,
	CreateGameInput,
    GameCommand,
    GameState,
} from "./types";


export function createGame(
    input: CreateGameInput
): GameState {
    throw new Error("createGame() not implemented");
}


export function applyAction(
    oldState: GameState,
    command: GameCommand
): ApplyActionResult {

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
