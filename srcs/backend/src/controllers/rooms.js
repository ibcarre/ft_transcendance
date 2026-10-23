const db = require('../db/db');
const pgp = require('pg-promise');
const {TransactionMode, isolationLevel} = pgp.txMode;
const bcrypt = require('bcrypt');
const {Roomcreated} = require('../socket/namespaces/gamerooms/events/Roomcreated');
const {RoomDeleted} = require('../socket/namespaces/gamerooms/events/Roomdeleted');
const {playerEvent} = require('../socket/namespaces/gamerooms/events/playerEvent');


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
            room = await t.one('INSERT INTO games VALUES(DEFAULT, $(password), $(ispass), $(name), DEFAULT, DEFAULT, DEFAULT, $(max_players), DEFAULT, $(user)) RETURNING *', {
                name: name,
                password: hashedPassword,
                ispass: ispass,
                max_players: max_players,
                user: req.user.name
            });
            await t.none('INSERT INTO users_in_game VALUES(DEFAULT, $(user), $(roomId), $(seat), DEFAULT)', {
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
            room = await t.one('SELECT * FROM games WHERE id = $1', id);
            if (!password && room.ispass)
                return (res.status(401).json({message: "Need a password"}))
            if (password) {
                const passwordMatch = await bcrypt.compare(password, room.password);
                if (!passwordMatch)
                        throw(Error("Wrong Password"));
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
                dataArray.push(others[o]);
            }
            dataArray = dataArray.sort();
            let seat = 0;
            for (let i = 0; i <= dataArray.length; i++) {
                if (i == dataArray.length && i !== 0)
                    seat = dataArray.at(-1).seat + 1;
                if (i !== dataArray.length && i !== dataArray.at(i).seat) {
                    seat = i;
                    break;
                }
            }
            await t.none('INSERT INTO users_in_game VALUES(DEFAULT, $(user), $(roomId), $(seat), DEFAULT)', {
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
        else if (error.message === "Wrong Password")
            return (res.status(401).json({message: "Wrong password"}));
        console.log("app=node ERROR: ", error)
        return (res.status(500).json({message: "Server error: try again later"}));
    }
};

exports.leaveRoom = async (req, res) => {
    console.log("app=node INFO: leaving room");
    try {
        const id = req.params.roomId;
        const user = req.user.id;
        const check = await db.oneOrNone('SELECT * FROM users_in_game WHERE game_id = $1 AND user_id = $2', [id, user]);
        if (!check)
            return (res.status(409).json({message: "You weren't in the room anyway"}));
        const room = await db.one('SELECT * FROM games WHERE id = $1', id);
		if (room.status === 'pending')
        	await db.none('DELETE FROM users_in_game WHERE game_id = $1 AND user_id = $2', [id, user]);
		playerEvent(room.nb_players - 1, room.id)
        if (room.nb_players <= 1) {
			if (room.status === 'pending')
            	await db.none('DELETE FROM games WHERE id = $1', id);
			RoomDeleted(room.id);
            //socket deleteRoom(room id)
        }
        else if (room.status === 'pending')
            await db.none('UPDATE games set nb_players = $1 WHERE id = $2', [room.nb_players - 1, room.id]);
        else {
            // leave quand en game
        }
        return (res.status(200).json({message: "Left room"}));
    }
    catch (error) {
        console.log("app=node ERROR: ", error);
        if (error.received === 0)
            return (res.status(404).json({ message: "User not in Room or Room not found" }));
        return (res.status(500).json({message: error}));
    }
}

exports.roomId = async (req, res) => {
    //return joueurs dans la room
    //nom de la game
    //son statut
}
