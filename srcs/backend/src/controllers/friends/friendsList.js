const db = require('../../db/db');

var FriendsList = async (req, res) => {
	try {
		const {friend} = req.body;
		const user = req.user.id;
	}
	catch (error) {
		console.log(error)
		return (res.status(500).json({message: "Server Error"}))
	}


}

module.exports = FriendsList;
