const db = require('../db')

var users = async (req, res) => {
    try {
        if (!req.query.api_key)
            return (res.status(403).send({message: "No API key"}));
        if (req.query.api_key !== process.env.API_KEY)
            return (res.status(403).send({message: "Wrong API_KEY"}));
        const users = await db.any('SELECT email, name, avatar_url FROM users');
        return (res.status(200).send(users));
    } catch (error) {
        console.log(error);
        return (res.status(500).json({message: "Server error"}));
    }
}

module.exports = users;
