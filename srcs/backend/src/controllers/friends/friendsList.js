const db = require('../../db/db');

var FriendsList = async (req, res) => {
	const {friend} = req.body;
	const user = req.user.id;


}

module.exports = FriendsList;
