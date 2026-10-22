const app = require('./app');
const { createServer } = require("node:http");
const {initSocket} = require('./socket/index');

const { reconcileInterruptedGames } = require('./game/gameService');

const port = 5000;
const httpServer = createServer(app);

async function startServer() {
    try {
        const cancelled = await reconcileInterruptedGames();
        if (cancelled > 0) {
            console.warn(
                `app=node WARN: cancelled ${cancelled} interrupted game(s)`);
        }
        initSocket(httpServer);
        httpServer.listen(port, () => { console.log(
                `app=node INFO: Server listening on port ${port}`);
        });
    } catch (error) { console.error(
        'app=node ERROR: server initialization failed:', error);
        process.exit(1);
    }
}

startServer();
