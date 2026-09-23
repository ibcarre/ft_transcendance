const jwt = require("jsonwebtoken");
const db = require('../db')

var profile = async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) return res.status(401).json({message: "Unauthorized: No token"});
        var decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        req.user = decoded.userId;
        const user = await db.one('SELECT email, name, avatar_url FROM users WHERE id = $1', req.user);
        if (!user)
            return res.status(404).json({message: "User not found"})
        return (res.status(200).send(user));
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            res.clearCookie('access_token');
            return (res.status(401).json({message: "Token Expired, please log back in"}));
        }
        if (error.name === "JsonWebTokenError") {
            res.clearCookie('access_token');
            return (res.status(401).json({message: "Wrong token, if you think this is an error, please log back in"}));
        }
        return (res.status(500).json({message: "Server error"}));
    }
}

module.exports = profile;
