const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const os = require("os");

const { getRealWirelessIP } = require("./utils/getRealIP");
const { errorHandler } = require("./middlewares/errorHandler");
const { loadPages, error404Page } = require('./routes/util');

const app = express();
const port = process.env.PORT || 4000;

// Defina o diretório base dinâmico onde seu exe e arquivos estarão:
// Usa APPDATA no Windows, ou equivalente para Linux/macOS (se precisar)
const appDataDir = process.env.APPDATA || 
    (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.local', 'share'));

// Diretório raiz do seu app (onde está o app.exe e as pastas)
const baseDir = path.join(appDataDir, "mercadoDidaticoDigital");

// Caminhos absolutos para as pastas importantes
const webpages_dir = path.join(baseDir, "webpages");
const uploads_dir = path.join(baseDir, "servidor/uploads");
const profiles_dir = path.join(baseDir, "uploads/profiles");

// Middlewares globais
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos a partir do diretório dinâmico
app.use(express.static(webpages_dir));
app.use('/servidor/uploads', express.static(uploads_dir));
app.use('/uploads/profiles', express.static(profiles_dir));

// Rotas organizadas em módulos (continue usando require normalmente)
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

// Carrega páginas HTML automaticamente a partir da pasta correta
loadPages(app, webpages_dir);

// Página de erro 404 explícita
app.get("/Error404", error404Page);

// Redirecionamentos para rotas inválidas
app.use((req, res) => {
  if (req.path === '/') {
    return res.redirect('/main'); // Redireciona para a home personalizada
  }
  return res.redirect('/Error404');
});

// Middleware de tratamento global de erros
app.use(errorHandler);

// Inicializa o servidor
app.listen(port, '0.0.0.0', () => {
  const serverIp = getRealWirelessIP();
  console.log(`Servidor iniciado em: http://localhost:${port}`);
  if (serverIp !== 'localhost') {
    console.log(`Acessível na rede: http://${serverIp}:${port}`);
  }
});
