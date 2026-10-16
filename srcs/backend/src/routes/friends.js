const express = require('express');
const router = express.Router();
const isLog = require('../middleware/Auth').isLog;
const addFriend = require('../controllers/friends/addFriend')
const removeFriend = require('../controllers/friends/removeFriend')
const FriendsList = require('../controllers/friends/friendsList')
const getInvites = require('../controllers/friends/getInvites');

router.use(isLog);
router.post('/add', addFriend);
router.post('/remove', removeFriend);
router.get('/list', FriendsList);
router.get('/invites', getInvites);

module.exports = router;
