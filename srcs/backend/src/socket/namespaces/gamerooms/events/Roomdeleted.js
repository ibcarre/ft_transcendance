const {getIo} = require('../../../../socket/index');

exports.RoomDeleted = (Room) => {
	console.log("Room ", Room, " deleted");
    getIo().of('/Rooms').emit("RoomDeleted", Room);
}
