//
// module.exports = (io) => {
//     io.of('/Rooms').on('connection', function () {
//         console.log("app=node INFO: user connected");
//     })
// }


'use strict';

const gameService = require('../../../game/gameService');

const fail = (code) => ({ ok: false, error: { code } });

module.exports = function initGameRooms(io, service = gameService) {
    const namespace = io.of('/Rooms');

    namespace.on('connection', (socket) => {
        const userId = socket.user?.id;

        socket.on('game:subscribe', async (request, acknowledge) => {
            if (typeof acknowledge !== 'function') return;

            let joinedRoom = null;

            try {
                if (!userId || !request || typeof request !== 'object'
                    || Array.isArray(request)
                    || typeof request.gameId !== 'string') {
                    acknowledge(fail('GAME_UNAVAILABLE'));
                    return;
                }
                const initial = service.getGameState(
                    request.gameId,
                    userId
                );
                if (!initial.ok) {
                    acknowledge(initial);
                    return;
                }
                joinedRoom = `game:${initial.publicState.id}`;
                await socket.join(joinedRoom);
                // Re-read after joining to avoid missing an update.
                const current = service.getGameState(
                    initial.publicState.id,
                    userId
                );
                if (!current.ok) {
                    await socket.leave(joinedRoom);
                    joinedRoom = null;
                }
                acknowledge(current);
            } catch (error) {
                if (joinedRoom !== null) {
                    try {
                        await socket.leave(joinedRoom);
                    } catch (leaveError) { console.error('Socket leave failed:',
														leaveError);
                    }
                }
                console.error('game:subscribe failed:', error);
                acknowledge(fail('INTERNAL_ERROR'));
            }
        });

        socket.on('game:action', (request, acknowledge) => {
            if (typeof acknowledge !== 'function') return;

            try {
                if (!request || typeof request !== 'object'
                    || Array.isArray(request)
                    || Object.keys(request).length !== 3
                    || !Object.hasOwn(request, 'gameId')
                    || !Object.hasOwn(request, 'action')
                    || !Object.hasOwn(request, 'expectedVersion')) {
                    acknowledge(fail('INVALID_ACTION_PAYLOAD'));
                    return;
                }

                const result = service.submitGameAction(
                    request.gameId,
                    userId,
                    request.action,
                    request.expectedVersion
                );

                if (result.ok) {
                    namespace.to(`game:${result.publicState.id}`)
                        .emit('game:state', result.publicState);
                }
                acknowledge(result);
            } catch (error) {
                console.error('game:action failed:', error);
                acknowledge(fail('INTERNAL_ERROR'));
            }
        });
    });
};
