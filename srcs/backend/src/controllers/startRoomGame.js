'use strict';

const gameService = require('../game/gameService');

const ERROR_STATUS = Object.freeze({
    INVALID_ROOM_ID: 400,
    ROOM_NOT_FOUND: 404,
    NOT_ROOM_OWNER: 403,
    ROOM_NOT_PENDING: 409,
    ROOM_STATE_INVALID: 409,
    START_IN_PROGRESS: 409,
    GAME_ALREADY_STARTED: 409
});

exports.startRoomGame = async (req, res) => {
    try {
        const result = await gameService.startGame(
            req.params.roomId,
            req.user.id
        );
        if (!result.ok) {
            const status = ERROR_STATUS[result.error.code] ?? 500;

            return res.status(status).json(result);
        }
        return res.status(201).json(result);
    } catch (error) {
        console.error(
            'app=node ERROR: failed to start game:',
            error
        );
        return res.status(500).json({
            ok: false,
            error: { code: 'GAME_START_FAILED' }
        });
    }
};
