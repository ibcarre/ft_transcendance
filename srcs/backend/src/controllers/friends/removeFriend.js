const db = require('../../db/db');

var removeFriend = async (req, res) => {
	const {friend} = req.body;
	const user = req.user.id;


}

module.exports = removeFriend;
