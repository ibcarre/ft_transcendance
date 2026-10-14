const {getIo} = require('../../../../socket/index');

exports.Roomcreated = (Room) => {
    getIo().of('/Rooms').emit("createRoom", Room);
}
