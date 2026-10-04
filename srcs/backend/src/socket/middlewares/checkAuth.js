const jwt = require("jsonwebtoken");
const db = require('../../db/db');


module.exports = async (socket, next) => {
    try {
        const token = socket.request.headers.cookie.split("=").pop();
        console.log("test");
        console.log(token);
        var decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        var user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', decoded.userId);
        if (!user) {
            socket.emit('disconnect');
            return next(new Error("unauthorized"));
        }
        console.log("Socket Auth");
    }
    catch (error) {
        socket.emit('disconnect');
        return next(new Error("unauthorized"));
    }
    next();
}
