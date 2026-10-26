const {getIo} = require('../../../../socket/index');

exports.RoomDeleted = (Room) => {
	console.log("app=node INFO: Room ", Room, " deleted");
    getIo().of('/Rooms').emit("RoomDeleted", Room);
}
