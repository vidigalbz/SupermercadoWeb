const express = require('express');
const router = express.Router();

const supermercadosController = require('../controllers/supermercadosController');

router.post("/supermercadoData", supermercadosController.supermercadoData);
router.post("/listarSupermercados", supermercadosController.listarSupermercados);
router.post("/deletarSupermercado", supermercadosController.deletarSupermercado);
router.post("/supermercadoData", supermercadosController.deletarSupermercado);
router.post("/updateSupermercado", supermercadosController.updateSupermercado);
router.post("/adicionarSupermercado", supermercadosController.adicionarSupermercado);

module.exports = router;