const {getIo} = require('../../../socket/index');

// module.exports = function(io) {
//     io.of('/Rooms').on('connection', function (socket) {
//         Roomcreated(socket);
//     })
// }

exports.Roomcreated = (RoomId) => {
    getIo().of('/Rooms').emit("createRoom", RoomId);
}

//exports.Roomcreated = (RoomId) => console.log(io);