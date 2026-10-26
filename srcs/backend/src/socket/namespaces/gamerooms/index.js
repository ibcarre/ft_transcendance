const gameManager = require('../../../game/gameService');
const db = require('../../../db/db');

const roomName = (gameId) => `game:${gameId}`;
const ROUND_PAUSE_MS = 5000;

const persistGameOver = async (gameId, state) => {
    if (state.phase !== 'GAME_OVER') {
        return;
    }

    await db.tx(async (t) => {
        const room = await t.oneOrNone(
            'SELECT status FROM games WHERE id = $1 FOR UPDATE', [gameId]
        );

        if (!room) {
            throw new Error(`Game ${gameId} not found`);
        }

        // Already recorded: do not insert winners again.
        if (room.status === 'finished') {
            return;
        }

        if (room.status !== 'playing') {
            throw new Error(`Cannot finish a game with status ${room.status}`);
        }

        if (!state.winnerIds?.length) {
            throw new Error('Finished game has no winners');
        }

        for (const winnerId of state.winnerIds) {
            await t.none(
                `INSERT INTO winner (game_id, user_id)
                 VALUES ($1, $2)`,
                [gameId, winnerId]
            );
        }

        await t.none(
            "UPDATE games SET status = 'finished' WHERE id = $1",
            [gameId]
        );
    });
};

module.exports = (io) => {
    const namespace = io.of('/Rooms');

    // One timer maximum per game.
    const roundTimers = new Map();

    const scheduleNextRound = (gameId, state) => {
        if (
            state.phase !== 'ROUND_FINISHED' ||
            roundTimers.has(gameId)
        ) {
            return;
        }

        const expectedVersion = state.version;

        const timer = setTimeout(() => {
            roundTimers.delete(gameId);

            const result = gameManager.advanceRound(
                gameId,
                expectedVersion
            );

            if (result.ok) {
                namespace.to(roomName(gameId)).emit(
                    'game:state',
                    result.publicState
                );
				persistGameOver(gameId, result.publicState);
            }
        }, ROUND_PAUSE_MS);

        roundTimers.set(gameId, timer);
    };

    namespace.on('connection', (socket) => {
        const userId = socket.user.id;

        const errorReply = (ack, code) => {
            const error = { code };

            if (typeof ack === 'function') {
                ack({ ok: false, error });
            } else {
                socket.emit('game:error', error);
            }
        };

        const successReply = (ack) => {
            if (typeof ack === 'function') {
                ack({ ok: true });
            }
        };

        const validGameId = (payload) =>
            typeof payload?.gameId === 'string' &&
            payload.gameId.length > 0;

        const handle = (event, callback) => {
            socket.on(event, async (payload, ack) => {
                try {
                    await callback(payload, ack);
                } catch (error) {
                    console.error(
                        `app=node ERROR: ${event}`,
                        error
                    );

                    errorReply(ack, 'SERVER_ERROR');
                }
            });
        };

        handle('game:subscribe', async (payload, ack) => {
            if (!validGameId(payload)) {
                return errorReply(
                    ack,
                    'INVALID_ACTION_PAYLOAD'
                );
            }

            const result = gameManager.getPublicState(
                payload.gameId,
                userId
            );

            if (!result.ok) {
                return errorReply(ack, result.error.code);
            }

            await socket.join(roomName(payload.gameId));

            socket.emit('game:state', result.publicState);

            successReply(ack);
        });

        handle('game:action', async (payload, ack) => {
            if (!validGameId(payload)) {
                return errorReply(
                    ack,
                    'INVALID_ACTION_PAYLOAD'
                );
            }

            if (!socket.rooms.has(roomName(payload.gameId))) {
                return errorReply(ack, 'GAME_UNAVAILABLE');
            }

            const result = gameManager.submitAction(
                payload.gameId,
                userId,
                payload.action,
                payload.expectedVersion
            );

            if (!result.ok) {
                if (result.error.code === 'VERSION_CONFLICT') {
                    const latest = gameManager.getPublicState(
                        payload.gameId,
                        userId
                    );

                    if (latest.ok) {
                        socket.emit(
                            'game:state',
                            latest.publicState
                        );
                    }
                }

                return errorReply(ack, result.error.code);
            }

			await persistGameOver(
				payload.gameId,
				result.publicState
			);

			namespace.to(roomName(payload.gameId)).emit(
				'game:state',
				result.publicState
			);

			scheduleNextRound(
			    payload.gameId,
			    result.publicState
			);

			successReply(ack);
        });
    });
};
