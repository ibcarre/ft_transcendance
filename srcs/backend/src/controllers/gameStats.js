const db = require('../db/db');

exports.nbWins = async (req, res) => {
    try {
		const user = req.user;
		const wins = await db.any('SELECT COUNT(*) FROM winner WHERE user_id = $1', user.id);
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
		const games = await db.any('SELECT COUNT(*) FROM users_in_game INNER JOIN games ON users_in_game.game_id = games.id WHERE users_in_game.user_id = $1 AND games.status = $2', [user.id, 'finished']);
		const wins = await db.any('SELECT COUNT(*) FROM winner WHERE user_id = $1', user.id);
		console.log(games)
		console.log(wins);
		const losses = {count: games[0].count - wins[0].count};
		if (!losses.count)
			losses.count = 0;
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
		const games = await db.any('SELECT games.id, games.name, games.status, games.created_at FROM games INNER JOIN users_in_game ON users_in_game.game_id = games.id WHERE users_in_game.user_id = $1', user.id);
		for (var i = 0; i < games.length ; i++) {
			console.log(games[i])
			const winner = await db.oneOrNone('SELECT 1 FROM winner WHERE game_id = $1 AND user_id = $2', [games[i].id, user.id]);
			console.log(winner);
			games[i].winner = false;
			if (winner)
				games[i].winner = true;
		}
		return (res.status(200).send(games));
    }
    catch (error) {
		console.log("app=node level=ERROR ", error);
		return (res.status(500).json({message: "Server Error"}))
    }
};
