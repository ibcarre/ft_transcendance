var sockets = [];

const notifInit = (io) => {
    io.of('/Notifications').on('connection', function (socket) {
        console.log(socket?.user);
		sockets.push(socket);
		socket.on('disconnect', function () {
			console.log("app=node INFO: Socket Notif disconnected");
			let i;
			for (i = 0; i < sockets.length; i++) {
				if (sockets[i].id === socket.id)
					break;
			}
			if (i < sockets.length) { // only splice array when item is found
				sockets.splice(i, 1); // 2nd parameter means remove one item only
				console.log("app=node INFO: Socket Notif deleted from list");
			}
			else {console.log("app=node INFO Couldn't find socket NOTIF (notifications/index.js L18)")}
    	})
    })
}

module.exports = {notifInit, sockets};
