const db = require('../../db/db');
const {inviteEvent} = require('../../socket/namespaces/notifications/events/InviteEventNotif');
const {sendInvite} = require('../../socket/namespaces/friendsList/events/invite');
const {newFriend} = require('../../socket/namespaces/friendsList/events/friendList');

//invite = id
//friends = id

var add = async (user, friend, requestedby, res) => {
	try {
		console.log(user.name, friend.name, requestedby.name)
		let invite = await db.oneOrNone('SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2', [user.id, friend.id]);
		//if invite doesnt exist create it and socket notif and socket invite
		//if it exists check if accepted, then accept it and socket friend
		console.log(invite);
		if (!invite) {
			invite = await db.one('INSERT INTO friends VALUES(DEFAULT, $(user_id), $(friend_id), $(requested_by), DEFAULT) RETURNING *', {
				user_id: user.id,
				friend_id: friend.id,
				requested_by: requestedby.id
			});
			if (user === requestedby){
				//emit invite friend && requestedby
				sendInvite(friend.id, user.id)
				//emit notif invite
				inviteEvent(friend.id);
			}
			else {
				//emit invite user && requestedby
				sendInvite(user.id, friend.id)
				//emit notif invite
				inviteEvent(user.id);
			}
			return (res.status(200).json({message: "Invite sent"}))
		}
		if (!invite.accepted) {
			if (requestedby.id !== invite.requested_by) {
				await db.none('UPDATE friends SET accepted = $1 WHERE user_id = $2 AND friend_id = $3', [true, user.id, friend.id]);
				//emit friendslist newfriend
				newFriend(user, friend);
				//emit notif invite
				inviteEvent(user.id);
				return (res.status(200).json({message: "Friendship accepted"}))
			}
			else
				return (res.status(200).json({message: "You already sent that invite"}));
		}
		return (res.status(200).json({message: "You already have that friend, make new friends"}))
	}
	catch(error) {
		throw(error);
	}
}

var addFriend = async (req, res) => {
	try {
		const user = req?.user;
		const {friendUsername} = req.body;
		if (!friendUsername || !user)
			return (res.status(400).json({message: "Empty friend name"}));
		if (friendUsername === user.name)
			return (res.status(400).json({message: "Can't add yourself"}));
		const userFriend = await db.oneOrNone('SELECT * FROM users WHERE name = $1', friendUsername);
		if (!userFriend)
			return (res.status(400).json({message: "User does not exist"}));
		return (user.id < userFriend.id ? await add(user, userFriend, user, res) : await add(userFriend, user, user, res));
	}
	catch (error) {
		console.log("app=node ERROR: addFriend ", error);
		return (res.status(500).json({message: "Server Error"}));
	}

}

module.exports = addFriend;
