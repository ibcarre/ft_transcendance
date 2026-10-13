const {getIo} = require('../../../../socket/index');

exports.playerEvent = (invite) => {
    console.log("app=node INFO: NB_players +1 in ", id);
    getIo().of("/Notifications").emit("InviteReceived", invite);
}
