const express = require('express');
const { roomId } = require('../controllers/rooms');
const router = express.Router();
const getRooms = require('../controllers/rooms').getRooms;
const createRoom = require('../controllers/rooms').createRoom;
const joinRoom = require('../controllers/rooms').joinRoom;
const leaveRoom = require('../controllers/rooms').leaveRoom;
const isLog = require('../middleware/Auth').isLog;
const { startRoomGame } = require('../controllers/startRoomGame');
const { setRoomReady } = require('../controllers/setRoomReady');

router.use(isLog);
router.get('/getRooms', getRooms);
router.post('/createRoom', createRoom);
router.post('/joinRoom/:roomId', joinRoom);
router.post('/leaveRoom/:roomId', leaveRoom);
router.post('/:roomId/start', startRoomGame);
router.get('/:roomId', roomId);
router.post('/:roomId/ready', setRoomReady);

module.exports = router;
