const {getIo} = require('../../../../socket/index');

exports.playerJoined = (nb_players, id) => {
    console.log("NB_players +1 in ", id);
    getIo().of("/Rooms").emit("playerJoined", { roomId: id, nbPlayers: nb_players });
}