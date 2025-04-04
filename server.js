require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração do middleware
app.use(cors());
app.use(bodyParser.json());

// Rota de Registro
app.post('/register', async (req, res) => {
    //CÓDIGO PARA REGISTRAR
});

// Rota de Login
app.post('/login', (req, res) => {
    //CÓDIGO PARA EFETUAR O LOGIN
});

// Rota protegida para testar autenticação
app.get('/profile', verifyToken, (req, res) => {
    res.json({ message: "Perfil do usuário autenticado!", user: req.user });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
