//
// module.exports = (io) => {
//     io.of('/Rooms').on('connection', function () {
//         console.log("app=node INFO: user connected");
//     })
// }


const gameManager = require('../../../game/gameService');

const roomName = (gameId) => `game:${gameId}`;

module.exports = (io) => {
	const namespace = io.of('/Rooms');

	namespace.on('connection', (socket) => {
		const userId = socket.user.id;

		const errorReply = (ack, code) => {
			const error = { code };
			if (typeof ack === 'function')
				ack({ ok: false, error });
			else
				socket.emit('game:error', error);
		};

		const successReply = (ack) => {
			if (typeof ack === 'function')
				ack({ ok: true });
		};

		const validGameId = (payload) =>
			typeof payload?.gameId === 'string'
				&& payload.gameId.length > 0;

		const handle = (event, callback) => {
			socket.on(event, async (payload, ack) => {
				try {
					await callback(payload, ack);
				} catch (error) {
					console.error(`app=node ERROR: ${event}`, error);
					errorReply(ack, 'SERVER_ERROR');
				}
			});
		};

		handle('game:subscribe', async (payload, ack) => {
			if (!validGameId(payload))
				return errorReply(ack, 'INVALID_ACTION_PAYLOAD');

			const result = gameManager.getPublicState(
				payload.gameId, userId
			);

			if (!result.ok)
				return errorReply(ack, result.error.code);

			await socket.join(roomName(payload.gameId));
			socket.emit('game:state', result.publicState);
			successReply(ack);
		});

		handle('game:action', (payload, ack) => {
			if (!validGameId(payload))
				return errorReply(ack, 'INVALID_ACTION_PAYLOAD');

			if (!socket.rooms.has(roomName(payload.gameId)))
				return errorReply(ack, 'GAME_UNAVAILABLE');

			const result = gameManager.submitAction(
				payload.gameId,
				userId,
				payload.action,
				payload.expectedVersion
			);

			if (!result.ok) {
				if (result.error.code === 'VERSION_CONFLICT') {
					const latest = gameManager.getPublicState(
						payload.gameId, userId
					);
					if (latest.ok)
						socket.emit('game:state', latest.publicState);
				}
				return errorReply(ack, result.error.code);
			}

			namespace.to(roomName(payload.gameId)).emit(
				'game:state', result.publicState
			);
			successReply(ack);
		});

		handle('game:nextRound', (payload, ack) => {
			if (!validGameId(payload))
				return errorReply(ack, 'INVALID_ACTION_PAYLOAD');

			if (!socket.rooms.has(roomName(payload.gameId)))
				return errorReply(ack, 'GAME_UNAVAILABLE');

			const authorized = gameManager.getPublicState(
				payload.gameId, userId
			);

			if (!authorized.ok)
				return errorReply(ack, authorized.error.code);

			const result = gameManager.advanceRound(
				payload.gameId,
				payload.expectedVersion
			);

			if (!result.ok)
				return errorReply(ack, result.error.code);

			namespace.to(roomName(payload.gameId)).emit(
				'game:state', result.publicState
			);
			successReply(ack);
		});
	});
};

