const db = require('../db/db');
const pgp = require('pg-promise');
const {TransactionMode, isolationLevel} = pgp.txMode;
const bcrypt = require('bcrypt');
const {Roomcreated} = require('../socket/namespaces/gamerooms/events/Roomcreated');
const {playerJoined} = require('../socket/namespaces/gamerooms/events/playerJoined');


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
        console.log(error);
        return (res.status(500).json({message: "Server error"}));
    }
};

exports.createRoom = async (req, res) => {
    console.log("room creation");
    let ispass = 0;
    const {password, name, max_players} = req.body;
    let hashedPassword = '';
    if (password) {
        ispass = 1;
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
    }
	try {
        var room = await db.oneOrNone('SELECT * FROM games WHERE name = $1', name);
        if (room) {
            return res.status(400).json({ message: "A room already has that name" });
        }
        room = await db.one('INSERT INTO games VALUES(DEFAULT, $(password), $(ispass), $(name), DEFAULT, DEFAULT, DEFAULT, $(max_players), DEFAULT, $(user)) RETURNING *', {
			name: name,
			password: hashedPassword,
            ispass: ispass,
			max_players: max_players,
			user: req.user.name
		});
        await db.none('INSERT INTO users_in_game VALUES(DEFAULT, $(user), $(roomId), $(seat), DEFAULT)', {
            user: req.user.id,
            roomId: room.id,
            seat: 0
        })
        delete room.password;
        delete room.status;
        delete room.goal;
        delete room.created_at;
        Roomcreated(room)
        return (res.status(201).send(room.id));
    }
    catch (error) {
        console.log(error);
        return (res.status(500).json({message: error}));
    }
};

exports.joinRoom = async (req, res) => {
    const id = req.params.roomId;
    try {
        const user = await db.oneOrNone('SELECT * FROM users_in_game WHERE game_id = $1 AND user_id = $2', [id, req.user.id]);
        if (user) return (res.status(409).json({message: "Already in room"}));
        // BEGIN
        var room;
        await db.tx({mode}, async t => {
            room = await t.one('SELECT * FROM games WHERE id = $1', id);
            if (room.nb_players >= room.max_players) { 
                throw(Error("Full room"));
            }
            if (room.status !== 'pending') {
                throw(Error("Game started"))
            }
            await t.none('UPDATE games SET nb_players = $1 WHERE id = $2', [room.nb_players + 1, room.id]);
        })
        .catch(error => {
            throw(error);
        });
        await db.none('INSERT INTO users_in_game VALUES(DEFAULT, $(user), $(roomId), $(seat), DEFAULT)', {
            user: req.user.id,
            roomId: room.id,
            seat: room.nb_players, //seat indexe a 0 alors que nb_players indexe a 1
        })
        playerJoined(room.nb_players + 1, room.id)
        return (res.status(201).json({message: "Room Joined"}))
    }
    catch (error) {
        if (error.message === "Full room")
            return (res.status(409).json({message: "Room is full"}));
        else if (error.message === "Game started")
            return (res.status(409).json({message: "Game has started"}));
        else if (error.received === 0)
            return (res.status(404).json({ message: "Room not found" }));
        console.log(error)
        return (res.status(500).json({message: error}));
    }
};

exports.leaveRoom = async (req, res) => {
    console.log("leaving room");
    const id = req.params.roomId;
    const user = req.user.id;
    try {
        const check = await db.oneOrNone('SELECT * FROM users_in_game WHERE game_id = $1 AND user_id = $2', [id, user]);
        if (!check)
            return (res.status(409).json({message: "You weren't in the room anyway"}));
        const room = await db.one('SELECT * FROM games WHERE id = $1', id);
        await db.none('DELETE FROM users_in_game WHERE game_id = $1 AND user_id = $2', [id, user]);
        if (room.nb_players <= 1) {
            await db.none('DELETE FROM games WHERE id = $1', id);


            //socket deleteRoom(room id)
        }
        else
            await db.none('UPDATE games set nb_players = $1 WHERE id = $2', [room.nb_players - 1, room.id]);
        return (res.status(200).json({message: "Left room"}));
    }
    catch (error) {
        console.log(error);
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