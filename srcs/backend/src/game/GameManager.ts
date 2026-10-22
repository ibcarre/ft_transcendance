import {
    ACTION,
    PHASE,
    applyAction,
    buildPublicState,
    createGame,
    startNextRound,
} from "../../game";

import type {
    CreateGameInput,
    GameCommand,
    GameId,
    GameState,
    PlayerId,
    PublicGameState,
} from "../../game";

import type {
	ErrorCode,
} from "../../game/constants";

import {
	getCreateGameInputError,
} from "../../game/createInputValidation";

export type ClientGameAction =
	| { type: "REVEAL_INITIAL_CARD"; position: number }
	| { type: "DRAW_DECK" }
	| { type: "DRAW_DISCARD" }
	| { type: "SWAP_CARD"; position: number }
	| { type: "DISCARD_DRAWN_CARD" }
	| { type: "REVEAL_CARD"; position: number };

export type ManagerErrorCode =
	| "GAME_ALREADY_EXISTS"
	| "INVALID_GAME_INPUT"
	| "GAME_UNAVAILABLE"
	| "VERSION_CONFLICT"
	| "INVALID_ACTION_PAYLOAD"
	| "INVALID_GAME_PHASE"
	| ErrorCode;

export type ManagerResult =
	| {
		ok: true;
		publicState: PublicGameState;
	}
	| {
		ok: false;
		error: { code: ManagerErrorCode };
	};

function fail(code: ManagerErrorCode): ManagerResult {
    return { ok: false, error: { code: code } };
}

function success(state: GameState): ManagerResult {
	return { ok: true, publicState: buildPublicState(state) };
}

function parseClientAction(value: unknown): ClientGameAction | null {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}
	const payload = value as Record<string, unknown>;
	const keys = Object.keys(payload);
	switch (payload.type) {
		case ACTION.DRAW_DECK:
		case ACTION.DRAW_DISCARD:
		case ACTION.DISCARD_DRAWN_CARD:
			if (keys.length !== 1 || keys[0] !== "type") {
			return null;
		}
		return { type: payload.type };
		case ACTION.REVEAL_INITIAL_CARD:
		case ACTION.SWAP_CARD:
		case ACTION.REVEAL_CARD:
			if (keys.length !== 2
			|| !Object.hasOwn(payload, "type")
			|| !Object.hasOwn(payload, "position")
			|| typeof payload.position !== "number"
			|| !Number.isInteger(payload.position)) {
				return null;
			}
			return { type: payload.type, position: payload.position };
		default: return null;
	}
}

export class GameManager {
	private readonly games = new Map<GameId, GameState>();
	private readonly random: () => number;
	
	constructor(random: () => number = Math.random) {
		this.random = random;
	}
	
	create(input: CreateGameInput): ManagerResult {
	    if (getCreateGameInputError(input) !== null) {
	        return fail("INVALID_GAME_INPUT");
	    }
		if (this.games.has(input.id)) {
			return fail("GAME_ALREADY_EXISTS");
		}
		const state = createGame(input, this.random);
		this.games.set(input.id, state);
		return success(state);
	}

	getPublicState(gameId: GameId, userId: PlayerId): ManagerResult {
		const state = this.findAuthorizedGame(gameId, userId);
		if (state === null) {
			return fail("GAME_UNAVAILABLE");
		}
		return success(state);
	}

	submitAction(gameId: GameId, userId: PlayerId, payload: unknown,
				 expectedVersion: number): ManagerResult {
		const state = this.findAuthorizedGame(gameId, userId);
		if (state === null) {
			return fail("GAME_UNAVAILABLE");
		}
		if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
			return fail("INVALID_ACTION_PAYLOAD");
		}
		if (expectedVersion !== state.version) {
			return fail("VERSION_CONFLICT");
		}
		const action = parseClientAction(payload);
		if (action === null) {
			return fail("INVALID_ACTION_PAYLOAD");
		}

		const command: GameCommand = { ...action, playerId: userId };

		const result = applyAction(state, command, this.random);
		if (!result.ok) {
			return { ok: false, error: result.error };
		}

		this.games.set(gameId, result.state);
		return { ok: true, publicState: result.publicState };
	}

	advanceRound(gameId: GameId, expectedVersion: number): ManagerResult {
		const state = this.games.get(gameId);
		if (state === undefined) {
			return fail("GAME_UNAVAILABLE");
		}
		if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
			return fail("INVALID_ACTION_PAYLOAD");
		}
		if (expectedVersion !== state.version) {
			return fail("VERSION_CONFLICT");
		}
		if (state.phase !== PHASE.ROUND_FINISHED) {
			return fail("INVALID_GAME_PHASE");
		}
		const nextState = startNextRound(state, this.random);
		this.games.set(gameId, nextState);
		return success(nextState);
	}

	remove(gameId: GameId): boolean {
		return this.games.delete(gameId);
	}

	private findAuthorizedGame(gameId: GameId, userId: PlayerId):
	GameState | null {
		const state = this.games.get(gameId);
		if (state === undefined) {
			return null;
		}
		for (const player of state.players) {
			if (player.id === userId) {
				return state;
			}
		}
		return null;
	}
}
