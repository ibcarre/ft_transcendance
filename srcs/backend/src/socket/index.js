const { Server } = require("socket.io");
const gameRoomsinit = require('./namespaces/gamerooms/index');
const checkAuth = require('./middlewares/checkAuth');
const {notifInit} = require('./namespaces/notifications/index');
const {friendsInit} = require('./namespaces/friendsList/index');
const {globalChatInit} = require('./namespaces/globalChat/index');


let io;
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
    cors: {
      origin: ["https://localhost:" + process.env.APP_PORT],
      credentials: true
    }
  });
  io.use(checkAuth);
  io.on("new_namespace", (namespace) => {
    namespace.use(checkAuth);
  });
  gameRoomsinit(io);
  notifInit(io);
  friendsInit(io);
  globalChatInit(io);
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return (io);
}

module.exports = {
    initSocket,
    getIo
}
