const db = require('../db/db');
const pgp = require('pg-promise');
const {TransactionMode, isolationLevel} = pgp.txMode;
const bcrypt = require('bcrypt');
const {Roomcreated} = require('../socket/namespaces/gamerooms/events/Roomcreated');
const {RoomDeleted} = require('../socket/namespaces/gamerooms/events/Roomdeleted');
const {playerEvent} = require('../socket/namespaces/gamerooms/events/playerEvent');
const gameManager = require('../game/gameService');
const { getIo } = require('../socket/index');


const mode = new TransactionMode({
    tiLevel: isolationLevel.serializable,
    readOnly: false,
    deferrable: false
});

exports.getRooms = async (req, res) => {
    try {
        const games = await db.any('SELECT id, name, ispass, created_by, nb_players, max_players FROM games WHERE status = $1', 'pending');
        return (res.status(200).send(games));
    }
    catch (error) {
        console.log("app=node ERROR: ", error);
        return (res.status(500).json({message: "Server error"}));
    }
};

exports.createRoom = async (req, res) => {
    console.log("app=node INFO: room creation");
    let ispass = 0;
	try {
		const {password, name, max_players} = req?.body;
		let hashedPassword = '';
		if (password) {
			ispass = 1;
			const saltRounds = 10;
			hashedPassword = await bcrypt.hash(password, saltRounds);
		}
        var room = await db.oneOrNone('SELECT * FROM games WHERE name = $1 AND status = $2', [name, 'pending']);
        if (room) {
            return res.status(400).json({ message: "A room already has that name" });
        }
		if (name.length < 1 || name.length > 24)
			return (res.status(400).json({ message: "Room's name must be between 1 and 24 characters" }))
		var users = await db.oneOrNone('SELECT * FROM users_in_game INNER JOIN games ON games.id = users_in_game.game_id WHERE (games.status = $2 OR games.status = $3) AND users_in_game.user_id = $1', [req.user.id, 'pending', 'playing']);
        		//const games = await db.any('SELECT name, status, winner, created_at FROM games INNER JOIN users_in_game ON users_in_game.game_id = games.id WHERE users_in_game.user_id = $1', user.id);

		if (users)
			return (res.status(409).json({message: "You can only be in one room"}))
        await db.tx({mode}, async t => {
            room = await t.one(`INSERT INTO games (password, ispass, name, max_players, created_by) VALUES ($(password), $(ispass), $(name), $(max_players), $(user)) RETURNING *`, {
                name: name,
                password: hashedPassword,
                ispass: ispass,
                max_players: max_players,
                user: req.user.name
            });
            await t.none('INSERT INTO users_in_game (user_id, game_id, seat) VALUES ($(user), $(roomId), $(seat))', {
                user: req.user.id,
                roomId: room.id,
                seat: 0
            })
            delete room.password;
            delete room.status;
            delete room.goal;
            delete room.created_at;
        }).catch(error => {
            throw(error);
        });
        Roomcreated(room)
        return (res.status(201).send(room.id));
    }
    catch (error) {
		if(error?.constraint === "max_players")
			return (res.status(400).json({message: "Wrong input for max players"}))
        console.log("app=node ERROR: ", error);
        return (res.status(500).json({message: "Server error, try again"}));
    }
};

exports.joinRoom = async (req, res) => {
    try {
        const id = req.params.roomId;
        const password = req?.body?.password;
        //const user = await db.oneOrNone('SELECT * FROM users_in_game WHERE game_id = $1 AND user_id = $2', [id, req.user.id]);
        //if (user) return (res.status(409).json({message: "Already in room"}));
        // BEGIN
		var users = await db.oneOrNone('SELECT * FROM users_in_game INNER JOIN games ON games.id = users_in_game.game_id WHERE (games.status = $2 OR games.status = $3) AND users_in_game.user_id = $1', [req.user.id, 'pending', 'playing']);

		if (users)
			return (res.status(409).json({message: "You can only be in one room"}))
        var room;
        await db.tx({mode}, async t => {
            room = await t.one('SELECT * FROM games WHERE id = $1 FOR UPDATE', [id]);
			if (room.ispass) {
			    if (!password || !(await bcrypt.compare(password, room.password))) {
			        throw new Error('Wrong password');
			    }
			}
            if (room.nb_players >= room.max_players) {
                throw(Error("Full room"));
            }
            if (room.status !== 'pending') {
                throw(Error("Game started"))
            }
            await t.none('UPDATE games SET nb_players = $1 WHERE id = $2', [room.nb_players + 1, room.id]);
            let others = await t.any('SELECT seat FROM users_in_game WHERE game_id = $1', id);
            var dataArray = [];
            for(var o in others) {
                dataArray.push(others[o].seat);
            }
            dataArray.sort((a, b) => a - b);
            let seat = 0;
            for (let i = 0; i <= dataArray.length; i++) {
                if (i == dataArray.length && i !== 0)
                    seat = dataArray.at(-1) + 1;
                if (i !== dataArray.length && i !== dataArray.at(i)) {
                    seat = i;
                    break;
                }
            }
            await t.none('INSERT INTO users_in_game (user_id, game_id, seat) VALUES ($(user), $(roomId), $(seat))', {
            user: req.user.id,
            roomId: room.id,
            seat: seat
            })
        })
        .catch(error => {
            throw(error);
        });
        playerEvent(room.nb_players + 1, room.id)
        return (res.status(201).json({message: "Room Joined"}))
    }
    catch (error) {
        if (error.message === "Full room")
            return (res.status(409).json({message: "Room is full"}));
        else if (error.message === "Game started")
            return (res.status(409).json({message: "Game has started"}));
        else if (error.received === 0)
            return (res.status(404).json({ message: "Room not found" }));
        else if (error.message === "Wrong password")
            return (res.status(401).json({message: "Wrong password"}));
        console.log("app=node ERROR: ", error)
        return (res.status(500).json({message: "Server error: try again later"}));
    }
};

exports.leaveRoom = async (req, res) => {
    const { roomId } = req.params;

    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(roomId)) {
        return res.status(400).json({
            message: 'Invalid room ID'
        });
    }

    try {
        const outcome = await db.tx(async (t) => {
            const room = await t.oneOrNone(
                `SELECT id, status, created_by, nb_players
                 FROM games
                 WHERE id = $1
                 FOR UPDATE`,
                [roomId]
            );

            if (!room) {
                return {
                    status: 404,
                    message: 'Room not found'
                };
            }

            const membership = await t.oneOrNone(
                `SELECT id
                 FROM users_in_game
                 WHERE game_id = $1 AND user_id = $2`,
                [roomId, req.user.id]
            );

            if (!membership) {
                return {
                    status: 409,
                    message: 'Not in this room'
                };
            }

            // Pending room.
            if (room.status === 'pending') {
                // Creator leaves: close the entire waiting room.
                if (
                    room.created_by === req.user.name ||
                    room.nb_players <= 1
                ) {
                    await t.none(
                        'DELETE FROM users_in_game WHERE game_id = $1',
                        [roomId]
                    );

                    await t.none(
                        'DELETE FROM games WHERE id = $1',
                        [roomId]
                    );

                    return { status: 200, kind: 'deleted' };
                }

                // A non-creator leaves: keep the room.
                await t.none(
                    `DELETE FROM users_in_game
                     WHERE game_id = $1 AND user_id = $2`,
                    [roomId, req.user.id]
                );

                await t.none(
                    `UPDATE games
                     SET nb_players = (
                         SELECT COUNT(*)::int
                         FROM users_in_game
                         WHERE game_id = $1
                     )
                     WHERE id = $1`,
                    [roomId]
                );

                return {
                    status: 200,
                    kind: 'left',
                    count: room.nb_players - 1
                };
            }

            // Active match: temporary policy is to cancel for everyone.
            if (room.status === 'playing') {
                await t.none(
                    "UPDATE games SET status = 'cancelled' WHERE id = $1",
                    [roomId]
                );

                await t.none(
                    'DELETE FROM users_in_game WHERE game_id = $1',
                    [roomId]
                );

                return { status: 200, kind: 'cancelled' };
            }

            // Already finished or cancelled.
            await t.none(
                `DELETE FROM users_in_game
                 WHERE game_id = $1 AND user_id = $2`,
                [roomId, req.user.id]
            );

            return { status: 200, kind: 'left' };
        });

        if (outcome.status !== 200) {
            return res.status(outcome.status).json({
                message: outcome.message
            });
        }

        // The database transaction has committed at this point.
        if (outcome.kind === 'cancelled') {
            gameManager.remove(roomId);
        }

        try {
            if (outcome.kind === 'deleted') {
                RoomDeleted(roomId);
            }

            if (
                outcome.kind === 'left' &&
                outcome.count !== undefined
            ) {
                playerEvent(outcome.count, roomId);
            }

            if (outcome.kind === 'cancelled') {
                const ns = getIo().of('/Rooms');

                ns.to(`game:${roomId}`).emit(
                    'game:cancelled',
                    { gameId: roomId }
                );

                ns.in(`game:${roomId}`).socketsLeave(
                    `game:${roomId}`
                );

                RoomDeleted(roomId);
            }
        } catch (notifyError) {
            console.error(
                'app=node ERROR: room notification failed',
                notifyError
            );
        }

        return res.status(200).json({
            message: 'Left room',
            cancelled: outcome.kind === 'cancelled'
        });
    } catch (error) {
        console.error('app=node ERROR: leaving room failed', error);

        return res.status(500).json({
            message: 'Server error'
        });
    }
};

exports.roomId = async (req, res) => {
    const { roomId } = req.params;

    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(roomId)) {
        return res.status(400).json({ message: 'Invalid room ID' });
    }

    try {
        const room = await db.oneOrNone(
            `SELECT g.id, g.name, g.status, g.created_by,
                    g.nb_players, g.max_players
             FROM games g
             JOIN users_in_game ug ON ug.game_id = g.id
             WHERE g.id = $1 AND ug.user_id = $2`,
            [roomId, req.user.id]
        );

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const players = await db.any(
			`SELECT u.id, u.name, ug.seat, ug.ready
			 FROM users_in_game ug
			 JOIN users u ON u.id = ug.user_id
			 WHERE ug.game_id = $1
			 ORDER BY ug.seat`,
			[roomId]
		);

        return res.status(200).json({ ...room, players });
    } catch (error) {
        console.error('app=node ERROR: room details failed', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
