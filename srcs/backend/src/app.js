const express = require('express');
const cookieParser = require("cookie-parser");
const clientProm = require("@prometheus-io/client");
const Userroutes = require('./routes/User');
const health = require('./controllers/health');
const rooms = require('./routes/rooms');
const api = require('./routes/api');
const cors = require("cors");

const app = express();
app.use(cors());

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

//Routes
app.use('/user', Userroutes);
app.get('/health', health);
app.use('/v1', api);
app.use('/rooms', rooms);

module.exports = app;
