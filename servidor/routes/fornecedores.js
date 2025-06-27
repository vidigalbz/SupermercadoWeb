const express = require('express');
const router = express.Router();

const fornecedoresController = require('../controllers/fornecedoresController');

router.post('/addFornecedor', fornecedoresController.addFornecedor);

router.post('/fornecedorData', fornecedoresController.getFornecedores);

router.post('/editarFornecedor', fornecedoresController.editarFornecedor);

router.post('/excluirFornecedor', fornecedoresController.excluirFornecedor);

router.post('/comprardofornecedor', fornecedoresController.comprarDoFornecedor);

module.exports = router;