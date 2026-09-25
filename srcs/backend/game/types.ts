import type {
    CardSource,
    Phase,
    TurnStage,
	ErrorCode,
} from "./constants";


export type GameId = string;
export type PlayerId = string;


export type CardValue =
    | -2
    | -1
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12;


export interface Card {
    id: number;
    value: CardValue;
}


export interface BoardCard {
    card: Card;
    revealed: boolean;
}


export type BoardSlot = BoardCard | null;


export interface PlayerState {
    id: PlayerId;

    board: BoardSlot[];

    totalScore: number;
}


export interface GameState {
    id: GameId;

    players: PlayerState[];

    deck: Card[];
    discardPile: Card[];

    phase: Phase;
    turnStage: TurnStage | null;

    currentPlayerId: PlayerId | null;

    pendingCard: Card | null;
    pendingCardSource: CardSource | null;

    roundNumber: number;

    roundFinisherId: PlayerId | null;
    finalTurnQueue: PlayerId[];

    version: number;
}










export interface CreateGamePlayerInput {
    id: PlayerId;
}

export interface CreateGameInput {
    id: GameId;
    players: CreateGamePlayerInput[];
}


export interface RevealInitialCardCommand {
    type: "REVEAL_INITIAL_CARD";
    playerId: PlayerId;
    position: number;
}


export interface DrawDeckCommand {
    type: "DRAW_DECK";
    playerId: PlayerId;
}


export interface DrawDiscardCommand {
    type: "DRAW_DISCARD";
    playerId: PlayerId;
}


export interface SwapCardCommand {
    type: "SWAP_CARD";
    playerId: PlayerId;
    position: number;
}


export interface DiscardDrawnCardCommand {
    type: "DISCARD_DRAWN_CARD";
    playerId: PlayerId;
}


export interface RevealCardCommand {
    type: "REVEAL_CARD";
    playerId: PlayerId;
    position: number;
}


export type GameCommand =
    | RevealInitialCardCommand
    | DrawDeckCommand
    | DrawDiscardCommand
    | SwapCardCommand
    | DiscardDrawnCardCommand
    | RevealCardCommand;

















export interface PublicBoardCard {
    status:
        | "hidden"
        | "revealed"
        | "removed";

    value?: CardValue;
}


export interface PublicPlayerState {
    id: PlayerId;

    board: PublicBoardCard[];

    totalScore: number;
}


export interface PublicGameState {
    id: GameId;

    players: PublicPlayerState[];

    phase: Phase;
    turnStage: TurnStage | null;

    currentPlayerId: PlayerId | null;

    roundNumber: number;

    deckCount: number;
    discardTop: CardValue | null;

    version: number;
}


export interface DirectReply {
    playerId: PlayerId;

    type: "DRAWN_CARD";

    value: CardValue;
}


export interface GameError {code: ErrorCode;}


export interface EngineSuccess {
    ok: true;

    state: GameState;

    publicState: PublicGameState;

    reply: DirectReply | null;
}


export interface EngineFailure {
    ok: false;

    error: GameError;
}


export type ApplyActionResult =
    | EngineSuccess
    | EngineFailure;
