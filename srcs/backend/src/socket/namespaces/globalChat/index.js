const globalChatInit = (io) => {
    io.of('/globalChat').on('connection', function (socket) {
        console.log("socket connected ", socket?.id);
        socket.on("newChat", (msg, userId) => {
            io.of('/globalChat').emit("messageReceived", msg, userId);
        })
    })
}

module.exports = {globalChatInit};
