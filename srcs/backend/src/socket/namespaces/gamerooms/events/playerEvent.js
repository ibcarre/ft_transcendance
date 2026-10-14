const {getIo} = require('../../../../socket/index');

exports.playerEvent = (nb_players, id) => {
    console.log("NB_players +1 in ", id);
    getIo().of("/Rooms").emit("playerEvent", { roomId: id, nbPlayers: nb_players });
}
