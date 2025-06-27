const express = require('express');
const router = express.Router();

const carrinhoController = require('../controllers/carrinhoController');

router.get('/getCarrinho', carrinhoController.getCarrinho);

router.post('/addCarrinho', carrinhoController.addCarrinho);

router.post('/finalizarCompra', carrinhoController.finalizarCompra);

module.exports = router;