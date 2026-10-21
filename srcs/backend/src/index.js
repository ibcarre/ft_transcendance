const app = require('./app');
const { createServer } = require("http");
const {initSocket} = require('./socket/index');


const port = 5000;

const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(port, () => {
    console.log(`app=node INFO: Server listening on port ${port}`);
});

