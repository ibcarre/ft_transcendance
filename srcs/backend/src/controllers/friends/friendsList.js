const db = require('../../db/db');

var FriendsList = async (req, res) => {
	try {
		const user = req.user;

		const friends = await db.any('SELECT * FROM friends WHERE accepted is TRUE AND (user_id = $1 OR friend_id = $1)', user.id);
		if (Object.keys(friends).length === 0)
			return (res.sendStatus(200));
		console.log("app=node level=INFO, friendsList: ", friends);
		const friendsId = [];
		friends.forEach((e)=> {
		if (e.user_id === user.id)
			friendsId.push(e.friend_id);
		else
			friendsId.push(e.user_id);
		})
		console.log("app=node level=INFO invitesId ", friendsId);
		return (res.status(200).send(friendsId));
	}
	catch (error) {
		console.log(error)
		return (res.status(500).json({message: "Server Error"}))
	}
}

module.exports = FriendsList;
