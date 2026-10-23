const db = require('../db/db');
const gameManager = require('../game/gameService');

exports.startRoomGame = async (req, res) => {
	const { roomId } = req.params;

	const validUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);

	console.log('DEBUG validUUID:', validUUID);

	if (!validUUID) {
		console.log('DEBUG: rejecting invalid UUID');
		return res.status(400).json({ message: 'Invalid room ID' });
	}

	console.log('DEBUG: UUID accepted, continuing...');

	let created = false;

	try {
		const response = await db.tx(async (t) => {
			const room = await t.oneOrNone(
				'SELECT id, status, goal, created_by, nb_players, max_players FROM games WHERE id = $1 FOR UPDATE',
				[roomId]
			);

			if (!room) {
				return { status: 404, body: { message: 'Room not found' } };
			}
			if (room.created_by !== req.user.name) {
				return { status: 403, body: { message: 'Only the room creator can start the game' } };
			}
			if (room.status !== 'pending') {
				return { status: 409, body: { message: 'Room is not pending' } };
			}

			const participants = await t.any(
				'SELECT user_id FROM users_in_game WHERE game_id = $1 ORDER BY seat',
				[roomId]
			);

			if (participants.length < 2 || participants.length > 4 ||
				participants.length !== room.nb_players || participants.length > room.max_players) {
				return { status: 409, body: { message: 'Invalid number of players in room' } };
			}

			const result = gameManager.create({
				id: room.id,
				players: participants.map((player) => ({ id: player.user_id })),
				targetScore: room.goal
			});

			if (!result.ok) {
				return { status: 409, body: { error: result.error.code } };
			}
			created = true;

			await t.none(
				'UPDATE games SET status = $1 WHERE id = $2',
				['playing', room.id]
			);

			return {
				status: 200,
				body: {
					gameId: room.id,
					publicState: result.publicState
				}
			};
		});

		return res.status(response.status).json(response.body);
	} catch (error) {
		if (created) gameManager.remove(roomId);
		console.error('app=node ERROR: game start failed', error);
		return res.status(500).json({ message: 'Server error' });
	}
};
