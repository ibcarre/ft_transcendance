const app = require('./app');
const { createServer } = require("http");
const {initSocket} = require('./socket/index');


const port = process.env.PORT || 5000;

const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(port, '0.0.0.0', () => {
    console.log(`app=node INFO: Server listening on port ${port}`);
});
