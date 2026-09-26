const db = require('../src/db')

var users = async (req, res) => {
    try {
        const users = await db.any('SELECT email, name, avatar_url FROM users');
        return (res.status(200).send(users));
    } catch (error) {
        console.log(error);
        return (res.status(500).json({message: "Server error"}));
    }
}

module.exports = users;
