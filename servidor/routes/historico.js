const express = require('express');
const router = express.Router();

const historicoController = require('../controllers/historicoController');

router.post('/historicoData', historicoController.getHistoricoData);

module.exports = router;