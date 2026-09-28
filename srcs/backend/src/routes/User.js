const express = require('express');
const router = express.Router();
const signup = require('../controllers/user_routes/signup');
const login = require('../controllers/user_routes/login');
const profile = require('../controllers/user_routes/profile');
const isLog = require('../middleware/Auth').isLog;

router.post('/signup', signup);
router.post('/login', login);
router.use('/profile', isLog);
router.get('/profile', profile);

module.exports = router;
