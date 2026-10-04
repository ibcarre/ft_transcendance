const {getIo} = require('../../../../socket/index');

exports.playerJoined = (nb_players) => {
    getIo().of('/Rooms').emit("playerJoined", nb_players);
}