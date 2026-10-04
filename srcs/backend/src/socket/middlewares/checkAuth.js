const jwt = require("jsonwebtoken");
const db = require('../../db/db');


module.exports = async (socket, next) => {
    try {
        const token = socket.request.headers.cookie.split("=").pop();
        var decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        var user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', decoded.userId);
        if (!user) {
            return next(new Error("unauthorized"));
        }
        console.log("Socket Auth");
    }
    catch (error) {
        return next(new Error("unauthorized"));
    }
    next();
}
