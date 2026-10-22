const db = require('../db/db');

exports.nbWins = async (req, res) => {
    try {
		const user = req.user;
		const wins = await db.any('SELECT nb_wins FROM users WHERE id = $1', user.id);
		return (res.status(200).send(wins));
    }
    catch (error) {
		console.log("app=node level=ERROR ", error);
		return (res.status(500).json({message: "Server Error"}))
    }
};

exports.nbLosses = async (req, res) => {
    try {
		const user = req.user;
		const losses = await db.any('SELECT nb_losses FROM users WHERE id = $1', user.id);
		return (res.status(200).send(losses));
    }
    catch (error) {
		console.log("app=node level=ERROR ", error);
		return (res.status(500).json({message: "Server Error"}))
    }
};

exports.getGames = async (req, res) => {
    try {
		const user = req.user;
		const games = await db.any('SELECT name, status, winner, created_at FROM games INNER JOIN users_in_game ON users_in_game.game_id = games.id WHERE users_in_game.user_id = $1', user.id);
		return (res.status(200).send(games));
    }
    catch (error) {
		console.log("app=node level=ERROR ", error);
		return (res.status(500).json({message: "Server Error"}))
    }
};
