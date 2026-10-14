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
	// if (invited_sock) {
    // 	getIo().of("/Friends").to(invited_sock.id).emit("newfriend", sender);
    // 	getIo().of("/Friends").to(sender_sock.id).emit("newfriend", recipient);
	// }
	//envoie juste l'id de la personne qui veut l'inviter
}


exports.removeFriend = (sender, recipient) => {
    console.log("app=node INFO: oldFriend ", sender, recipient);
	const invited_sock = sockets.find((elem) => elem.user.id === recipient);
	const sender_sock = sockets.find((elem) => elem.user.id === sender);
	console.log(invited_sock);
	if (invited_sock) {
    	getIo().of("/Friends").to(invited_sock.id).emit("removeFriend", sender);
    	getIo().of("/Friends").to(sender_sock.id).emit("removeFriend", recipient);
	}
	//envoie juste l'id de la personne qui ne veut plus l'inviter
}
