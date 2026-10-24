const db = require('../../db/db');

var getProfile = async (req, res) => {
    try {
        const user = req.user;
		const profileId = req?.params?.profileId;
        let pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        let result = pattern.test(profileId);
        if (!result)
            return (res.sendStatus(400))
        if (profileId === user.id)
            return (res.redirect('/profile')) //a tester
        const profile = await db.oneOrNone('SELECT name, avatar_url, status FROM users WHERE id = $1', profileId);
        if (!profile)
            return (res.status(404).json({message: "Can't find this profile"}));
        const friend = await (user.id < profileId ? db.oneOrNone('SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2', [user.id, profileId]) : db.oneOrNone('SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2', [profileId, user.id]));
        console.log(friend);
        if (!friend)
            profile.friend = false;
        else
            profile.friend = true;
        let nb_wins = 0;
        let nb_losses = 0;
        const games = await db.any('SELECT games.id, games.name, games.status, games.created_at FROM games INNER JOIN users_in_game ON users_in_game.game_id = games.id WHERE users_in_game.user_id = $1', profileId);
		for (var i = 0; i < games.length ; i++) {
			console.log(games[i])
			const winner = await db.oneOrNone('SELECT 1 FROM winner WHERE game_id = $1 AND user_id = $2', [games[i].id, profileId]);
			console.log(winner);
			games[i].winner = false;
			if (winner) {
                games[i].winner = true;
                nb_wins++;
            }
            else {
                if (games[i].status === 'finished') 
                    nb_losses++ 
            }
		}
        profile.games = games;
        profile.nb_wins = nb_wins;
        profile.nb_losses = nb_losses;
        return (res.status(200).send(profile));
    }
    catch (error) {
        console.log("app=node ERROR: ", error);
        if (error.received === 0)
            return (res.status(401).json({ message: "User doesn't exist" }));
        return (res.status(500).send("Failed to find user, try again later"));
    }
}

module.exports = getProfile
