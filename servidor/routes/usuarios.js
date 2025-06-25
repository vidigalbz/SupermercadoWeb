const express = require('express');
const router = express.Router();

const usuariosController = require('../controllers/usuariosController');

router.post("/cadastro", usuariosController.cadastro);
router.post("/login", usuariosController.login);
router.post("/loginWithId", usuariosController.loginWithId);
router.get("/users/:userId", usuariosController.getUserById);
router.get("/user_permissions/:userId", usuariosController.getUserPermissions);

module.exports = router;