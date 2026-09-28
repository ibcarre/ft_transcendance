const express = require('express');
const router = express.Router();
const users = require('./users');
const rateLimit = require('express-rate-limit');
const middlewares = require('../src/middlewares');
const checkKey = middlewares.checkKey;

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

// Apply rate limiting to requests to public api
router.use(limiter);
router.use(checkKey);

router.get('/users', users);

module.exports = router;
