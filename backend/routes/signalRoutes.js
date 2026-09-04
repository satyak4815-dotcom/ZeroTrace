const express = require('express');
const router = express.Router();
const { processSignal } = require('../controllers/signalController');

router.post('/analyze', processSignal);

module.exports = router;