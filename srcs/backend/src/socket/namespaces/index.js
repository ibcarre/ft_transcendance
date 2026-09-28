module.exports = function(io) {
    io.of('/Rooms').on('connection', function (socket) {
        socket.on("getRooms", function() {
            console.log("getRooms");
        });
        //socket.emit("responseToSomeEventFromClient", { data: {}, socket })
    })
}