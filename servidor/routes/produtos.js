const express = require('express');
const router = express.Router();

const produtosController = require('../controllers/produtosController');

const { uploadProduto } = require('../middlewares/uploadImagemProduto');

router.post('/adicionarProduto', uploadProduto.single("imagem"), produtosController.adicionarProduto);

router.post('/deletarProduto', produtosController.deletarProduto);

router.post('/editarProduto', uploadProduto.single("imagem"), produtosController.editarProduto);

router.post('/estoqueData', produtosController.consultarEstoque);

router.post('/getAlerts', produtosController.getAlertas);

module.exports = router;