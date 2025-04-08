const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'webpages')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'webpages', 'login', 'index.html'));
  });

const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conectar e criar tabela
const db = new sqlite3.Database('./bancodedados.sqlite', (err) => {
  if (err) return console.error(err.message);
  console.log('💾 Conectado ao banco de dados SQLite.');

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
  )`);
});

// Rota de cadastro
app.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;

  const query = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;
  db.run(query, [nome, email, senha], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ status: 'error', message: 'Email já cadastrado.' });
      }
      return res.status(500).json({ status: 'error', message: 'Erro ao cadastrar.' });
    }
    res.status(201).json({ status: 'success', message: 'Usuário cadastrado com sucesso!' });
  });
});

// Rota de login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const query = `SELECT * FROM usuarios WHERE email = ? AND senha = ?`;
  db.get(query, [email, senha], (err, row) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Erro interno.' });

    if (row) {
      res.json({ status: 'success', message: 'Login realizado com sucesso.', nome: row.nome });
    } else {
      res.status(401).json({ status: 'error', message: 'Email ou senha incorretos.' });
    }
  });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });