const express = require('express');
const router = express.Router();
const signup = require('../controllers/user_routes/signup');
const login = require('../controllers/user_routes/login');
const logout = require('../controllers/user_routes/logout');
const profile = require('../controllers/user_routes/profile');
const getImage = require('../controllers/user_routes/getImage');
const isLog = require('../middleware/Auth').isLog;
const editProfile = require('./edit_profile');
const { userDataValidate } = require("../middleware/user_validation");

router.post('/signup', userDataValidate, signup);
router.post('/login', login);

router.use('/logout', isLog);
router.post('/logout', logout);

router.use('/profile', isLog);
router.get('/profile', profile);

router.use('/image/:image', isLog);
router.get('/image/:image', getImage);

router.use('/edit_profile', isLog);
router.use('/edit_profile', editProfile);

module.exports = router;
