const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const { getRealWirelessIP } = require("./utils/getRealIP");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();
const port = process.env.PORT || 4000;

const webpages_dir = path.join(__dirname, "../webpages");

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(webpages_dir));
app.use('/servidor/uploads', express.static(path.join(__dirname, 'servidor/uploads')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));

// Rotas organizadas em módulos
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/profileImages', require('./middlewares/uploadImagemPerfil'));
app.use('/api/setores', require('./routes/setores'));
app.use('/api/supermercados', require('./routes/supermercados'));
app.use('/api/fornecedores', require('./routes/fornecedores'));
app.use('/api/historico', require('./routes/historico'));
app.use('/api/funcionarios', require('./routes/funcionarios'));
app.use('/api/carrinho', require('./routes/carrinho'));
app.use('/api/relatorio', require('./routes/relatorio'));
app.get('/api/ip', (req, res) => res.json({ ip: getRealWirelessIP() }));

// Páginas dinâmicas
const { loadPages } = require('./routes/util');
loadPages(app, webpages_dir);

// Página de erro 404
app.get("/Error404", require('./routes/util').error404Page);

app.use((req, res) => {
  if (req.path === '/') {
    return res.redirect('/main');
  }

  return res.redirect('/Error404');
});

// Middleware de tratamento global de erros
app.use(errorHandler);

// Inicializa servidor
app.listen(port, '0.0.0.0', () => {
  const serverIp = getRealWirelessIP();
  console.log(`Servidor iniciado em http://localhost:${port}`);
  if (serverIp !== 'localhost') console.log(`Rede: http://${serverIp}:${port}`);
});
