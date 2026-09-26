const express = require('express');
const cookieParser = require("cookie-parser");
const clientProm = require("@prometheus-io/client");


const app = express();
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
app.use('/user', Userroutes);
app.use('/v1', api);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
