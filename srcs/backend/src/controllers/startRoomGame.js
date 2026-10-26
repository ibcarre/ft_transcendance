const db = require('../db/db');
const gameManager = require('../game/gameService');
const { RoomDeleted } = require('../socket/namespaces/gamerooms/events/Roomdeleted');

// Called inside a transaction that has locked the room (FOR UPDATE).
async function startLockedRoom(t, room, markCreated) {
    if (room.status !== 'pending') {
        return {
            status: 409,
            body: { message: 'Room is not pending' }
        };
    }

    const players = await t.any(
        'SELECT user_id, ready FROM users_in_game WHERE game_id = $1 ORDER BY seat',
        [room.id]
    );

    if (players.length < 2 || players.length > 4 ||
        players.length !== room.nb_players ||
        players.length > room.max_players) {
        return {
            status: 409,
            body: { message: 'Invalid number of players' }
        };
    }

    if (players.some((player) => !player.ready)) {
        return {
            status: 409,
            body: { message: 'All players must be ready' }
        };
    }

    const result = gameManager.create({
        id: room.id,
        players: players.map((player) => ({
            id: player.user_id
        })),
        targetScore: room.goal
    });

    if (!result.ok) {
        return {
            status: 409,
            body: { error: result.error.code }
        };
    }

    markCreated();

    await t.none(
        "UPDATE games SET status = 'playing' WHERE id = $1",
        [room.id]
    );

    return {
        status: 200,
        body: {
            gameId: room.id,
            publicState: result.publicState
        }
    };
}

exports.startLockedRoom = startLockedRoom;

exports.startRoomGame = async (req, res) => {
    const { roomId } = req.params;

    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(roomId)) {
        return res.status(400).json({
            message: 'Invalid room ID'
        });
    }

    let created = false;

    try {
        const response = await db.tx(async (t) => {
            const room = await t.oneOrNone(
                `SELECT id, status, goal, created_by,
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

            if (room.created_by !== req.user.name) {
                return {
                    status: 403,
                    body: {
                        message: 'Only the room creator can start the game'
                    }
                };
            }

            return startLockedRoom(t, room, () => {
                created = true;
            });
        });

		if (response.status === 200) {
		    try {
		        RoomDeleted(roomId);
		    } catch (error) {
		        console.error('Room notification failed:', error);
		    }
		}

        return res.status(response.status).json(response.body);
    } catch (error) {
        if (created) gameManager.remove(roomId);

        console.error('app=node ERROR: game start failed', error);

        return res.status(500).json({
            message: 'Server error'
        });
    }
};
