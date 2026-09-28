const db = require('../../db/db');

var profile = async (req, res) => {
    try {
        const user = await db.one('SELECT email, name, avatar_url FROM users WHERE id = $1', req.user);
        return (res.status(200).send(user));
    } catch (error) {
        if (error.received === 0)
            return (res.status(404).json({ message: "User not found" }));
        return (res.status(500).json({message: "Server error"}));
    }
}

//profile avec id

module.exports = profile;
