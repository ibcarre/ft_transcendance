const {getIo} = require('../../../../socket/index');
const {sockets} = require('../index')

exports.inviteEvent = (recipient) => {
    console.log("app=node INFO: NOTIF recipientId ", recipient);
	const invited_sock = sockets.filter((elem) => elem.user.id === recipient);
	invited_sock.forEach((el) => getIo().of("/Notifications").to(el.id).emit("invNotifReceived"))
	sockets.forEach((element) => console.log(element?.user?.id, element?.id));
}
