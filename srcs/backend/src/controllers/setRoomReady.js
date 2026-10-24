const db = require('../db/db');
const gameManager = require('../game/gameService');
const { startLockedRoom } = require('./startRoomGame');

exports.setRoomReady = async (req, res) => {
    const { roomId } = req.params;

    const value = req.body?.ready;

    const ready =
        value === true || value === 'true' ? true :
        value === false || value === 'false' ? false :
        null;

    if (
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(roomId) ||
        ready === null
    ) {
        return res.status(400).json({
            message: 'Invalid room ID or ready value'
        });
    }

    let created = false;

    try {
        const response = await db.tx(async (t) => {
            const room = await t.oneOrNone(
                `SELECT id, status, goal,
                        nb_players, max_players
                 FROM games
                 WHERE id = $1
                 FOR UPDATE`,
                [roomId]
            );

            if (!room) {
                return {
                    status: 404,
                    body: { message: 'Room not found' }
                };
            }

            if (room.status !== 'pending') {
                return {
                    status: 409,
                    body: { message: 'Game already started' }
                };
            }

            const player = await t.oneOrNone(
                `SELECT id
                 FROM users_in_game
                 WHERE game_id = $1 AND user_id = $2`,
                [roomId, req.user.id]
            );

            if (!player) {
                return {
                    status: 403,
                    body: { message: 'Not a room player' }
                };
            }

            await t.none(
                `UPDATE users_in_game
                 SET ready = $3
                 WHERE game_id = $1 AND user_id = $2`,
                [roomId, req.user.id, ready]
            );

            const counts = await t.one(
                `SELECT
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE ready)::int AS ready_count
                 FROM users_in_game
                 WHERE game_id = $1`,
                [roomId]
            );

            // Automatically start a full room when everyone is ready.
            if (
                counts.total >= 2 &&
                counts.total === room.max_players &&
                counts.ready_count === counts.total
            ) {
                const result = await startLockedRoom(
                    t,
                    room,
                    () => { created = true; }
                );

                if (result.status !== 200) {
                    return result;
                }

                return {
                    status: 200,
                    body: {
                        ready,
                        started: true,
                        gameId: roomId
                    }
                };
            }

            return {
                status: 200,
                body: {
                    ready,
                    started: false
                }
            };
        });

		if (response.status === 200 && response.body.started) {
		    try {
		        RoomDeleted(roomId);
		    } catch (error) {
		        console.error('Room notification failed:', error);
		    }
		}

        return res.status(response.status).json(response.body);
    } catch (error) {
        if (created) gameManager.remove(roomId);

        console.error('app=node ERROR: ready update failed', error);

        return res.status(500).json({
            message: 'Server error'
        });
    }
};
