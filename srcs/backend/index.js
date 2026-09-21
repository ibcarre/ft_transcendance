const express = require('express');
const rateLimit = require('express-rate-limit');
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
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window 
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP address',
    retryAfter: '15 minutes',
    documentation: 'https://api.example.com/docs/rate-limits'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000) //resetTime = milliseconds
    });
  }
});
// Apply rate limiting to all requests
app.use(limiter);

// Import the router
const Userroutes = require('./Userroutes');

// Use the router for all paths starting with '/'
app.use('/user', Userroutes);

//app.get('/', 
   //(req, res) => res.send('Dockerizing Node Application'));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
