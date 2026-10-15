const db = require('../db/db');

var health = async (req, res) => {
	try {
		await db.one('SELECT 1');
		return (res.status(200).send());
	}
	catch (error) {
		console.log(error);
		return (res.status(503).send());
	}
}

module.exports = health;
