
module.exports = function(io) {
    io.on("/getRooms", function (socket) {
        console.log("on getRooms");
        //socket.emit("responseToSomeEventFromClient", { data: {}, socket })
    })
}