const { Server } = require("socket.io");

let io;
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
    cors: {
      origin: ["https://localhost:44443"],
      credentials: true
    }
  });
  io.of('/Rooms').on('connection', function () {
    console.log("user connected");
  })
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