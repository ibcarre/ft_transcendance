const {getIo} = require('../../../../socket/index');
const {sockets} = require('../index')

exports.newFriend = (sender, recipient) => {
    console.log("app=node INFO: newFriend ", sender, recipient);
	sockets.forEach((e) => console.log("app=node INFO: ", e.user.name, ": ", " socket: ", e.id, " id: ", e.user.id));
	const invited_sock = sockets.filter((elem) => elem.user.id === recipient.id);
	invited_sock.forEach((elem) => getIo().of("/Friends").to(elem.id).emit("newfriend", sender));
	console.log("invited sock length ", invited_sock.length);
	const sender_sock = sockets.filter((elem) => elem.user.id === sender.id);
	console.log("sender sock length ", sender_sock.length);
	sender_sock.forEach((elem) => getIo().of("/Friends").to(elem.id).emit("newfriend", recipient));
}


exports.oldFriend = (sender, recipient) => {
    console.log("app=node INFO: oldFriend ", sender, recipient);
	sockets.forEach((e) => console.log("app=node INFO: ", e.user.name, ": ", " socket: ", e.id, " id: ", e.user.id));
	const invited_sock = sockets.filter((elem) => elem.user.id === recipient.id);
	invited_sock.forEach((elem) => getIo().of("/Friends").to(elem.id).emit("removeFriend", sender));
	console.log("old friend recipient sock length ", invited_sock.length);
	const sender_sock = sockets.filter((elem) => elem.user.id === sender.id);
	console.log("old friend sender sock length ", sender_sock.length);
	sender_sock.forEach((elem) => getIo().of("/Friends").to(elem.id).emit("removeFriend", recipient));
	//envoie l'ancien ami a tt le monde concerné
}
