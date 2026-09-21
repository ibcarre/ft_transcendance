const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();
const cookieParser = require("cookie-parser");


const port = 5000;
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
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