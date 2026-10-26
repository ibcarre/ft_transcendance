import { MAX_PLAYERS, MIN_PLAYERS } from "./constants";

/**
 * Return null for a valid creation input,
 * or a diagnostic message for an invalid input.
 */
export function getCreateGameInputError(input: unknown): string | null {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return "createGame() requires an object input";
    }

    const value = input as Record<string, unknown>;

    if (!Array.isArray(value.players)
        || value.players.length < MIN_PLAYERS
        || value.players.length > MAX_PLAYERS) {
        return `createGame() requires ${MIN_PLAYERS} to ${MAX_PLAYERS}`;
    }

    if (typeof value.id !== "string" || value.id.trim().length === 0) {
        return "createGame() requires a non-empty game-ID";
    }

    const playerIds: string[] = [];

    for (const player of value.players) {
        if (typeof player !== "object"
			|| player === null
			|| Array.isArray(player)) {
            return "createGame() requires non-empty player IDs";
        }

        const playerId = (player as Record<string, unknown>).id;
        if (typeof playerId !== "string" || playerId.trim().length === 0) {
            return "createGame() requires non-empty player IDs";
        }
        playerIds.push(playerId);
    }

    const targetScore =
		value.targetScore === undefined ? 100 : value.targetScore;

    if (typeof targetScore !== "number"
        || !Number.isSafeInteger(targetScore)
        || targetScore <= 0) {
        return "createGame() requires a positive integer targetScore";
    }

    if (new Set(playerIds).size !== playerIds.length) {
        return "createGame() requires unique player IDs";
    }
    return null;
}
