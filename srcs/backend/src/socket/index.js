const { Server } = require("socket.io");

function Socket(httpServer){
    const io = new Server(httpServer, {
    cors: {
      origin: ["https://localhost:44443"],
      credentials: true
    }
  });

    //io.use(socketAuthMiddleware);
    // Full path to the current directory
    const listeners = require('./listeners/index');
    listeners(io);
    const namespaces = require('./namespaces')
    namespaces(io);
    console.log('Socket.io initialized');
    return io;
};

module.exports = Socket;