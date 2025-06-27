const express = require('express');
const router = express.Router();

const funcionariosController = require('../controllers/funcionariosController');

router.post('/funcionarios', funcionariosController.funcionarios);
router.post('/atualizarFuncionario', funcionariosController.updateFuncionarios);

module.exports = router;