const {getIo} = require('../../../../socket/index');
const {sockets} = require('../index')

exports.sendInvite = (recipient, invite) => {
	console.log("app=node INFO: SENDING INVITE")
    console.log("app=node INFO: invited_id ", recipient);
	const invited_sock = sockets.filter((elem) => elem.user.id === recipient);
	console.log("app=node INFO: sending invite to ", invited_sock.length, " sockets")
	invited_sock.forEach((elem) => getIo().of("/Friends").to(elem.id).emit("sendInvite", invite));
	//envoie juste l'id de la personne qui veut l'inviter
}

exports.removeInvite = (recipient) => {
	console.log("app=node INFO: removing INVITE")
    console.log("app=node INFO: invited_id ", recipient);
	const invited_sock = sockets.filter((elem) => elem.user.id === recipient);
	console.log("app=node INFO: sending invite to ", invited_sock.length, " sockets")
	invited_sock.forEach((elem) => getIo().of("/Friends").to(elem.id).emit("removeInvite", recipient));
	//envoie juste l'id de la personne qui veut plus l'inviter
}
