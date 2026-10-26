const {getIo} = require('../../../../socket/index');

exports.playerEvent = (nb_players, id) => {
    console.log("app=node INFO: NB_players change in ", id);
    getIo().of("/Rooms").emit("playerEvent", { roomId: id, nbPlayers: nb_players });
}
