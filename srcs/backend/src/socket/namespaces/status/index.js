const db = require('../../../db/db')

const StatusInit = (io) => {
    io.of('/').on('connection', function (socket) {
        console.log("socket connected ", socket?.id);
        socket.on("online", async () => {
            try {
                await db.none('UPDATE users SET status = $1 WHERE id = $2', ['online', socket?.user?.id]);
            } catch (e) {
                console.log(e);
            }
        })
        socket.on("offline", async () => {
            try {
                await db.none('UPDATE users SET status = $1 WHERE id = $2', ['offline', socket?.user?.id]);
            } catch (e) {
                console.log(e);
            }
        })
    })
}

module.exports = StatusInit;
