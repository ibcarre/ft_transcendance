const jwt = require("jsonwebtoken");
const db = require('../db')

var profile = async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) return res.status(401).json({message: "Unauthorized: No token"});
        jwt.verify(token, process.env.JWT_SECRETKEY, function(err, decoded) {
            if (err)
                return res.status(403).json({ error: 'Invalid token' });
            req.user = decoded.userId
        });
        const user = await db.one('SELECT * FROM users WHERE id = $1', req.user);
        if (!user)
            return res.status(404).json({message: "User not found"})
        return (res.status(200).send(user));
    } catch (error) {
        console.log(error);
        return (res.status(500).json({message: "Server error"}));
    }
}

module.exports = profile;
