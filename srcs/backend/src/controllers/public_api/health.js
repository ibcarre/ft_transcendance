const db = require('../../db/db');

var health = async (req, res) => {
	try {
		await db.one('SELECT 1');
		return (res.sendStatus(200));
	}
	catch (error) {
		console.log("app=node INFO: ", error);
		return (res.status(503).send());
	}
}

module.exports = health;
