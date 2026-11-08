const express = require('express');
const cookieParser = require("cookie-parser");
const clientProm = require("@prometheus-io/client");
const Userroutes = require('./routes/User');
const friends = require('./routes/friends');
const rooms = require('./routes/rooms');
const gameStats = require('./routes/gameStats');
const fileUpload = require('express-fileupload');
const cors = require("cors");
require('./db/db');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};

app.set('trust proxy', 1);

app.use(cors(corsOptions));

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
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));


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
app.use('/rooms', rooms);
app.use('/friends', friends);
app.use('/gameStats', gameStats);

module.exports = app;
