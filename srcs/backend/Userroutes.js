const express = require('express');
const router = express.Router();
const db = require('./db');
const signup = require('./signup');

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

module.exports = router;
