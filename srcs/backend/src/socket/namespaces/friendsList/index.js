var sockets = [];

const friendsInit = (io) => {
    io.of('/Friends').on('connection', function (socket) {
		sockets.push(socket);
		console.log("app=node INFO: connection : socket friends");
		socket.on('disconnect', function () {
			console.log("app=node INFO: Socket friends disconnected");
			let i = sockets.findIndex((element) => element.id === socket.id);
			if (i == -1) {console.log("app=node INFO Couldn't find socket Friends (friends/index.js L18)")}
			while (i > -1) {
				sockets.splice(i, 1);
				console.log("app=node INFO: Socket friends deleted from list");
				console.log("app=node INFO: disconnect socket friends list: ", sockets.forEach((e) => e.id), "\nEND");
				i = sockets.findIndex((element) => element.id === socket.id)
			}
    	})
    })
}

module.exports = {friendsInit, sockets};
