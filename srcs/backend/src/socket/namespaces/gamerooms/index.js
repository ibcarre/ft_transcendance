
module.exports = (io) => {
    io.of('/Rooms').on('connection', function () {
        console.log("app=node INFO: user connected");
    })
}
