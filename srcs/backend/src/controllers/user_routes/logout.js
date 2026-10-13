const db = require('../../db/db')

var logout = async (req, res) => {
    try {
        const userId = req.user.id;
		const user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', userId);
		if (!user)
			return (res.status(401).json({ message: "User doesn't exist" }));
		await db.none('UPDATE users SET status = $1 WHERE id = $2', ['offline', userId]);
		res.clearCookie('access_token');
		return (res.status(205).send());
    }
    catch (error) {
        console.log("app=node ERROR: ", error);
        return (res.status(500).send("Failed to log out, please retry"));
    }
}

module.exports = logout
