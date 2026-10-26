const express = require('express');
const router = express.Router();
const nbWins = require('../controllers/gameStats').nbWins;
const nbLosses = require('../controllers/gameStats').nbLosses;
const getGames = require('../controllers/gameStats').getGames;
const isLog = require('../middleware/Auth').isLog;

router.use(isLog);
router.get('/wins', nbWins);
router.get('/losses', nbLosses);
router.get('/gamesList', getGames);

module.exports = router;
