const db = require('../../db/db');
const {removeInvite} = require('../../socket/namespaces/friendsList/events/invite')
const {oldFriend} = require('../../socket/namespaces/friendsList/events/friendList')

var remove = async (user, friend, client, res) => {
	try {
		let invite = await db.oneOrNone('SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2', [user.id, friend.id]);
		if (!invite) {return (res.status(400).json({message: "Not friends"}))};
		await db.none('DELETE FROM friends WHERE id = $1', invite.id);
		if (!invite.accepted) {
			//pas amis
			console.log(invite.requested_by, user.id)
			if (invite.requested_by === client.id) {
				client.id === user.id ? removeInvite(friend.id) : removeInvite(user.id);
				return (res.status(200).json({message: "Invite cancelled"}))
			}
			else {
				client.id === user.id ? removeInvite(friend.id) : removeInvite(user.id);
				return (res.status(200).json({message: "Invite refused"}))
			}
		}
		else {
			oldFriend(user, friend);
			return (res.status(200).json({message: "No more friends"}));
		}
	}
	catch (error) {
		throw(error);
	}
}
var removeFriend = async (req, res) => {
	try {
		const {friendUsername} = req?.body;
		const user = req?.user;
		if (!friendUsername || !user)
			return (res.status(400).json({message: "Empty friend name"}));
		if (friendUsername === user.name)
			return (res.status(400).json({message: "Can't remove yourself"}));
		const userFriend = await db.oneOrNone('SELECT * FROM users WHERE name = $1', friendUsername);
		if (!userFriend)
			return (res.status(400).json({message: "User does not exist"}));
		return (user.id < userFriend.id ? await remove(user, userFriend, user, res) : await remove(userFriend, user, user, res));
	}
	catch (error) {
		console.log("app=node ERROR: addFriend ", error);
		return (res.status(500).json({message: "Server Error"}));
	}
}

module.exports = removeFriend;
