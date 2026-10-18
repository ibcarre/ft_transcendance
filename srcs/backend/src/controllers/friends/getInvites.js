const db = require('../../db/db');

var getInvites = async (req, res) => {
	try {
		const user = req.user;

		const invites = await db.any('SELECT * FROM friends WHERE requested_by != $1 AND accepted is FALSE AND (user_id = $1 OR friend_id = $1)', user.id);
		if (Object.keys(invites).length === 0)
			return (res.status(200).send());
		console.log(invites);
		console.log(invites[0].requested_by, user.id);
		const invitesId = [];
		invites.forEach((e)=> {
		if (e.user_id === user.id)
			invitesId.push(e.friend_id);
		else
			invitesId.push(e.user_id);
		})
		console.log("app=node level=INFO invitesId ", invitesId);
		return (res.status(200).send(invitesId));
	}
	catch (e) {
		console.log(e);
		return (res.status(500).json({message: "Server Error"}));
	}
}

module.exports = getInvites;
