const express = require('express');
const router = express.Router();
const signup = require('./signup');
const login = require('./login');
const profile = require('./profile');
const middlewares = require('../src/middlewares');
const isLog = middlewares.isLog;

// router.get('/', (req, res) => {
//     db.none('INSERT INTO users VALUES(DEFAULT, $(email), $(name), $(password), $(avatar_url))', {
//         email: 'email2',
//         name: 'name',
//         password: 'password',
//         avatar_url: 'avatar_url'
//     }).catch(error => {
//         console.log('ERROR:', error); // print the error;
//     });
//     console.log("test");
//     res.send("ASDASDASDA");
// });

router.post('/signup', signup);
router.post('/login', login);
router.use('/profile', isLog);
router.get('/profile', profile);

module.exports = router;
