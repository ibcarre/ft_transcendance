const express = require('express');
const cookieParser = require("cookie-parser");
const clientProm = require("@prometheus-io/client");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const port = 5000;

// metric need to be declared before limite to avoid 429

const registerProm = new clientProm.Registry();
clientProm.collectDefaultMetrics({ register: registerProm });

const httpRequests = new clientProm.Counter({
	name: "backend_http_requests_total",
	help: "How many HTTP requests",
	labelNames: ['method', 'path', 'status'],
	registers: [registerProm],
});

app.get('/metrics', async (_req, res) => {
	res.set('Content-Type', registerProm.contentType);
	res.end(await registerProm.metrics());
})

app.use(cookieParser());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
	res.on('finish', () => {
		const path = req.route?.path ? req.baseUrl + req.route.path : req.path;
		httpRequests.inc({
			method: req.method,
			path,
			status: String(res.statusCode),
		});
	});
	next();
})

// Import the router
const Userroutes = require('./user_routes/Userrouter');
const api = require('./public_api/v1router');

//const apirouter = require('./apirouter');
//const apirouter = require('./apirouter');
// Use the router for all paths starting with '/'
app.get('/', async (_req, res) => {
	res.send("hello world");
});
app.use('/user', Userroutes);
app.use('/v1', api);

io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err.message);
    console.error('Details:', err);
});

io.on("connection", (socket) => {
	console.log(socket);
  	console.log("SOCKET connected");
    socket.on('disconnect', (reason) => {
        console.log('SOCKET DISCONNECTED:', socket.id, reason);
    });
});

httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
