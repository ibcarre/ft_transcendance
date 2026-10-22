const db = require('../../db/db');

var getProfile = async (req, res) => {
    try {
        const user = req.user;
		const profileId = req?.params?.profileId;
        if (profileId === user.id)
            return (res.redirect('/profile')) //a tester
        const profile = await db.oneOrNone('SELECT name, avatar_url, status, nb_wins, nb_losses FROM users WHERE id = $1', profileId);
        if (!profile)
            return (res.status(404).json({message: "Can't find this profile"}));

        const friend = await (user.id < profileId ? db.oneOrNone('SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2', [user.id, profileId]) : db.oneOrNone('SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2', [profileId, user.id]));
        console.log(friend);
        if (!friend)
            profile.friend = false;
        else
            profile.friend = true;
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
