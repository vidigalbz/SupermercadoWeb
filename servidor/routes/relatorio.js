const express = require('express');
const router = express.Router();

const relatorioController = require('../controllers/relatorioController');

router.post('/data', relatorioController.getRelatorioData);

module.exports = router;