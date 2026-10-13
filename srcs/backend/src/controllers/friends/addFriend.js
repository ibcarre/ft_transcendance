const db = require('../../db/db');

var addFriend = async (req, res) => {
	const {friend} = req.body;
	const user = req.user.id;


}

module.exports = addFriend;
