const jwt = require("jsonwebtoken");
const db = require('../../db/db');


module.exports = async (socket, next) => {
    try {
        const token = socket.request.headers.cookie.split("=").pop();
        var decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        var user = await db.oneOrNone('SELECT id, email, name, avatar_url, status FROM users WHERE id = $1', decoded.userId);
        if (!user) {
            return next(new Error("unauthorized"));
        }
		socket.user = user;
        console.log("app=node INFO: Socket Auth");
    }
    catch (error) {
        return next(new Error("unauthorized"));
    }
    next();
}
