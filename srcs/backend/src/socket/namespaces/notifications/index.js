var sockets = [];

const notifInit = (io) => {
    io.of('/Notifications').on('connection', function (socket) {
		sockets.push(socket);
		console.log("app=node INFO: connection : socket notif");
		socket.on('disconnect', function () {
			console.log("app=node INFO: Socket Notif disconnected");
			let i = sockets.findIndex((element) => element.id === socket.id);
			if (i == -1) {console.log("app=node INFO Couldn't find socket notif (notif/index.js L18)")}
			while (i > -1) {
				sockets.splice(i, 1);
				console.log("app=node INFO: Socket notif deleted from list");
				console.log("app=node INFO: disconnect socket notif list: ", sockets.forEach((e) => e.id), "\nEND");
				i = sockets.findIndex((element) => element.id === socket.id)
			}
    	})
    })
}

module.exports = {notifInit, sockets};
