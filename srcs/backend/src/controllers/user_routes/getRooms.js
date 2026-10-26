const db = require('../../db/db')

var getUserGameRoom = async (req, res) => {
    try {
		const user = req.user;
        const room = await db.oneOrNone('SELECT game_id FROM users_in_game INNER JOIN games ON users_in_game.game_id = games.id WHERE (games.status = $1 OR games.status = $2) AND users_in_game.user_id = $3', ['pending', 'playing', user.id]);
        return res.status(200).json(room);
    }
    catch (error) {
        console.log("app=node ERROR: ", error);
        return (res.status(500).send("Server Error"));
    }
}

module.exports = getUserGameRoom
