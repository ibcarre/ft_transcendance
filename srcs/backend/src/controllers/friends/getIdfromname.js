const db = require('../../db/db');

var getId = async (req, res) => {
	try {
		const name = req?.params?.name;
		const userId = await db.oneOrNone('SELECT id FROM users WHERE name = $1', name);
		if (!userId)
			return (res.status(404).json({message : "Can't find user"}));
		return (res.status(200).send(userId));
	}
	catch (e) {
		console.log(e);
		return (res.status(500).json({message: "Server Error"}));
	}
}

module.exports = getId;
