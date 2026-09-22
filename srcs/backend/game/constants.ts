export const PHASE = {
    INITIAL_REVEAL: "INITIAL_REVEAL",
    PLAYING: "PLAYING",
    GAME_OVER: "GAME_OVER",
} as const;

export type Phase = typeof PHASE[keyof typeof PHASE];


export const TURN_STAGE = {
    WAITING_FOR_DRAW: "WAITING_FOR_DRAW",
    DRAWN_FROM_DECK: "DRAWN_FROM_DECK",
    MUST_SWAP_DISCARD: "MUST_SWAP_DISCARD",
    MUST_REVEAL_CARD: "MUST_REVEAL_CARD",
} as const;

export type TurnStage =
	typeof TURN_STAGE[keyof typeof TURN_STAGE];


export const ACTION = {
    REVEAL_INITIAL_CARD:
        "REVEAL_INITIAL_CARD",

    DRAW_DECK:
        "DRAW_DECK",

    DRAW_DISCARD:
        "DRAW_DISCARD",

    SWAP_CARD:
        "SWAP_CARD",

    DISCARD_DRAWN_CARD:
        "DISCARD_DRAWN_CARD",

    REVEAL_CARD:
        "REVEAL_CARD",
} as const;

export type ActionType =
	typeof ACTION[keyof typeof ACTION];


export const CARD_SOURCE = {
    DECK: "DECK",
    DISCARD: "DISCARD",
} as const;

export type CardSource =
    typeof CARD_SOURCE[keyof typeof CARD_SOURCE];


export const ERROR_CODE = {
    UNKNOWN_ACTION:
        "UNKNOWN_ACTION",

    GAME_OVER:
        "GAME_OVER",

    PLAYER_NOT_FOUND:
        "PLAYER_NOT_FOUND",

    NOT_YOUR_TURN:
        "NOT_YOUR_TURN",

    ACTION_NOT_ALLOWED:
        "ACTION_NOT_ALLOWED",

    INVALID_POSITION:
        "INVALID_POSITION",

    CARD_NOT_HIDDEN:
        "CARD_NOT_HIDDEN",
} as const;

export type ErrorCode =
    typeof ERROR_CODE[keyof typeof ERROR_CODE];


export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export const BOARD_ROWS = 3;
export const BOARD_COLUMNS = 4;
export const BOARD_SIZE = 12;
