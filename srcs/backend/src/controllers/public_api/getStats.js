const db = require('../../db/db')

exports.nbWins = async (req, res) => {
    try {
        const id = req.params.userId;
		let pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        let result = pattern.test(id);
        if (!result)
            return (res.sendStatus(400))
		const wins = await db.any('SELECT COUNT(*) FROM winner WHERE user_id = $1', id);
		const count = wins[0];
		return (res.status(200).send(count));
    }
    catch (error) {
		console.log("app=node level=ERROR ", error);
		return (res.status(500).json({message: "Server Error"}))
    }
};

exports.nbLosses = async (req, res) => {
    try {
		const user = req.params.userId;
		let pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        let result = pattern.test(user);
        if (!result)
            return (res.sendStatus(400))
		const games = await db.any('SELECT COUNT(*) FROM users_in_game INNER JOIN games ON users_in_game.game_id = games.id WHERE users_in_game.user_id = $1 AND games.status = $2', [user, 'finished']);
		const wins = await db.any('SELECT COUNT(*) FROM winner WHERE user_id = $1', user);
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
		const user = req.params.userId;
		let pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        let result = pattern.test(user);
        if (!result)
            return (res.sendStatus(400))
		const games = await db.any('SELECT games.id, games.name, games.status, games.created_at FROM games INNER JOIN users_in_game ON users_in_game.game_id = games.id WHERE users_in_game.user_id = $1', user);
		for (var i = 0; i < games.length ; i++) {
			console.log(games[i])
			const winner = await db.oneOrNone('SELECT 1 FROM winner WHERE game_id = $1 AND user_id = $2', [games[i].id, user]);
			console.log(winner);
			games[i].winner = false;
			if (winner)
				games[i].winner = true;
		}
		return (res.status(200).send(games));    }
    catch (error) {
		console.log("app=node level=ERROR ", error);
		return (res.status(500).json({message: "Server Error"}))
    }
};