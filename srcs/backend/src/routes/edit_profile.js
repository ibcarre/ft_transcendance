const express = require('express');
const router = express.Router();

const edit_username = require('../controllers/user_routes/edit/username');
const edit_password = require('../controllers/user_routes/edit/password');
const edit_email = require('../controllers/user_routes/edit/email');
const edit_picture = require('../controllers/user_routes/edit/picture');


//router.put('/username', edit_username);
//router.put('/password', edit_password);
router.put('/email', edit_email);
router.put('/picture', edit_picture);

module.exports = router;
