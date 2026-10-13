
module.exports = function(io) {
    io.on("/getRooms", function (socket) {
        console.log("app=node INFO: on getRooms");
        //socket.emit("responseToSomeEventFromClient", { data: {}, socket })
    })
}
