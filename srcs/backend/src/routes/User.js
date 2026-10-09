const express = require('express');
const router = express.Router();
const signup = require('../controllers/user_routes/signup');
const login = require('../controllers/user_routes/login');
const profile = require('../controllers/user_routes/profile');
const isLog = require('../middleware/Auth').isLog;
const editProfile = require('./edit_profile');
const { userDataValidate } = require("../middleware/user_validation");

router.post('/signup', userDataValidate, signup);
router.post('/login', login);
router.use('/profile', isLog);
router.get('/profile', profile);
router.use('/edit_profile', isLog);
router.use('/edit_profile', editProfile);

module.exports = router;
