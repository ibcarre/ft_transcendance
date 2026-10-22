'use strict';

const { GameManager } = require('../../build/src/game/GameManager.js');

const { MIN_PLAYERS, MAX_PLAYERS } = require('../../build/game/constants.js');

const UUID_PATTERN =
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const fail = (code) => ({ ok: false, error: { code } });

function normalizeGameId(gameId) {
    return typeof gameId === 'string' && UUID_PATTERN.test(gameId)
		? gameId.toLowerCase() : null;
}

function createGameService(database, manager) {
    const starting = new Set();
    async function startGame(gameId, requesterId) {
        const id = normalizeGameId(gameId);
        if (id === null) {
            return fail('INVALID_ROOM_ID');
        }
        if (starting.has(id)) {
            return fail('START_IN_PROGRESS');
        }
        starting.add(id);
        let createdHere = false;
        try {
            return await database.tx(async (tx) => {
                const room = await tx.oneOrNone(`
                    SELECT g.id, g.status, g.goal, g.nb_players,
                           g.max_players, owner.id AS owner_id
                    FROM games AS g
                    JOIN users AS owner
                        ON owner.name = g.created_by
                    WHERE g.id = $1
                    FOR UPDATE OF g`, [id]);
                if (room === null) {
                    return fail('ROOM_NOT_FOUND');
                }
                if (String(room.owner_id) !== String(requesterId)) {
                    return fail('NOT_ROOM_OWNER');
                }
                if (room.status !== 'pending') {
                    return fail('ROOM_NOT_PENDING');
                }
                const participants = await tx.any(`
                    SELECT user_id, seat
                    FROM users_in_game
                    WHERE game_id = $1
                    ORDER BY seat
                    FOR SHARE
                `, [id]);
                const seats = participants.map((player) => player.seat);
                const playerIds = participants.map(
					(player) => String(player.user_id));
                const consistent =
                    participants.length >= MIN_PLAYERS
                    && participants.length <= MAX_PLAYERS
                    && participants.length <= room.max_players
                    && participants.length === room.nb_players
                    && Number.isSafeInteger(room.goal)
                    && room.goal > 0
                    && seats.every(
						(seat) => Number.isInteger(seat)
                            && seat >= 0
                            && seat < room.max_players)
                    && new Set(seats).size === seats.length
                    && new Set(playerIds).size === playerIds.length
                    && playerIds.includes(String(room.owner_id));
                if (!consistent) {
                    return fail('ROOM_STATE_INVALID');
                }
                const created = manager.create({
                    id: String(room.id),
                    players: playerIds.map((playerId) => ({
                        id: playerId
                    })),
                    targetScore: room.goal
                });
                if (!created.ok) {
                    return fail(
                        created.error.code === 'GAME_ALREADY_EXISTS'
                            ? 'GAME_ALREADY_STARTED'
                            : 'ROOM_STATE_INVALID'
                    );
                }
                createdHere = true;
                await tx.one(`
                    UPDATE games
                    SET status = 'playing'
                    WHERE id = $1 AND status = 'pending'
                    RETURNING id
                `, [id]);
                return created;
            });
        } catch (error) {
            if (createdHere) {
                manager.remove(id);
                // Handle a potentially ambiguous COMMIT outcome.
                try {
                    await database.none(`
                        UPDATE games
                        SET status = 'cancelled'
                        WHERE id = $1 AND status = 'playing'
                    `, [id]);
                } catch (cleanupError) {
                    console.error(
                        'Unable to reconcile failed game start:',
                        cleanupError
                    );
                }
            }
            throw error;
        } finally {
            starting.delete(id);
        }
    }

    function getGameState(gameId, userId) {
        const id = normalizeGameId(gameId);

        if (id === null || starting.has(id)) {
            return fail('GAME_UNAVAILABLE');
        }

        return manager.getPublicState(id, String(userId));
    }


	function submitGameAction(gameId, userId, action, expectedVersion) {
	    const id = normalizeGameId(gameId);
	
	    if (id === null || starting.has(id) || !userId) {
	        return fail('GAME_UNAVAILABLE');
	    }
	    return manager.submitAction(
	        id,
	        String(userId),
	        action,
	        expectedVersion
	    );
	}


    async function reconcileInterruptedGames() {
        const interrupted = await database.any(`
            UPDATE games
            SET status = 'cancelled'
            WHERE status = 'playing'
            RETURNING id
        `);

        return interrupted.length;
    }

    return {
        startGame,
        getGameState,
		submitGameAction,
        reconcileInterruptedGames
    };
}

let defaultService;

function getDefaultService() {
    if (defaultService === undefined) {
        const db = require('../db/db');
        defaultService = createGameService(db, new GameManager());
    }
    return defaultService;
}

module.exports = {
    createGameService,

    startGame: (...args) =>
        getDefaultService().startGame(...args),

    getGameState: (...args) =>
        getDefaultService().getGameState(...args),

	submitGameAction: (...args) =>
		getDefaultService().submitGameAction(...args),

    reconcileInterruptedGames: (...args) =>
        getDefaultService().reconcileInterruptedGames(...args)
};
