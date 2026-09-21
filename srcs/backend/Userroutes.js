const express = require('express');
const router = express.Router();
const db = require('./db');
const signup = require('./user_routes/signup');
const login = require('./user_routes/login');
const profile = require('./user_routes/profile');

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
router.get('/profile', profile);

module.exports = router;
