
module.exports = (io) => {
    io.of('/Rooms').on('connection', function () {
        console.log("user connected");
    })
}
