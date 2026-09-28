import type {
    GameState,
    PublicGameState,
} from "./types";


export function buildPublicState(
    _state: GameState
): PublicGameState {
    throw new Error(
        "buildPublicState() not implemented"
    );
}
