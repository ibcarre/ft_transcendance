const app = require('./app');
const { createServer } = require("http");
const Socket = require('./socket')


const port = 5000;

const httpServer = createServer(app);

exports.io = Socket(httpServer);

httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
