const db = require('../../../db/db')

const StatusInit = (io) => {
    io.of('/').on('connection', function (socket) {
        console.log("socket connected ", socket?.id);
        socket.on("online", (userId) => {
            try {
                db.none('UPDATE users SET status = $1 WHERE id = $2', ['online', userId]);
            } catch (e) {
                console.log(e);
            }
        })
        socket.on("offline", (userId) => {
            try {
                db.none('UPDATE users SET status = $1 WHERE id = $2', ['offline', userId]);
            } catch (e) {
                console.log(e);
            }
        })
    })
}

module.exports = StatusInit;