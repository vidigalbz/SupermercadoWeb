const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cookieParser = require('cookie-parser');

const { select, insert, update, delet, query, db } = require("./database.js");

const app = express();
const port = 4000;

const webpages_dir = path.join(__dirname, "../webpages");
var pages = [];

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------
// Configuração do Multer para Upload de Perfis
// -------------------------------------------------
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads", "profiles");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const userId = req.body.userId || "unknown";
    const ext = file.originalname.split('.').pop();
    cb(null, `profile-${userId}-${Date.now()}.${ext}`);
  }
});
const uploadProfile = multer({ storage: profileStorage });

// -------------------------------------------------
// Permitir acesso estático à pasta /uploads
// -------------------------------------------------
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// -------------------------------------------------
// Rota para obter IP (já existente)
// -------------------------------------------------
const os = require('os');
function getRealWirelessIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        iface.address.startsWith('172.16')
      ) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
app.get('/api/ip', (req, res) => {
  const ip = getRealWirelessIP();
  res.json({ ip });
});

// -------------------------------------------------
// Carregamento de páginas estáticas (já existente)
// -------------------------------------------------
async function loadPages() {
  app.use(express.static(webpages_dir));
  fs.readdir(webpages_dir, (err, arquivos) => {
    if (err) return;
    pages = arquivos.filter(arquivo => {
      const caminho = path.join(webpages_dir, arquivo);
      return fs.statSync(caminho).isDirectory();
    });

    for (let i = 0; i < pages.length; i++) {
      const temp_path = `${webpages_dir}/${pages[i]}/index.html`;
      if (fs.existsSync(temp_path) && pages[i] != "main") {
        app.get(`/${pages[i]}`, (req, res) => res.sendFile(temp_path));
      } else if (pages[i] == "main") {
        app.get("/", (req, res) => res.sendFile(temp_path));
      }
    }
  });
}

// -------------------------------------------------
// Endpoint para adicionar produto
// (permanece igual ao original)
// -------------------------------------------------
app.post("/adicionarProduto", multer().single("imagem"), async (req, res) => {
  try {
    let imagempath;
    if (req.file) {
      let imagem = req.file;
      imagempath = imagem.path;
    } else {
      const { imagem } = req.body;
      imagempath = imagem;
    }

    const {
      nome,
      codigo,
      preco,
      categoria,
      estoque,
      lote,
      departamento,
      marketId,
      fabricacao,
      validade,
    } = req.body;

    if (
      !nome ||
      !codigo ||
      !preco ||
      !categoria ||
      !estoque ||
      !lote ||
      !departamento ||
      !marketId ||
      !fabricacao ||
      !validade
    ) {
      return res.status(400).json({ erro: "Campos obrigatórios estão ausentes." });
    }

    const produto = {
      nome,
      codigo,
      preco: parseFloat(preco),
      categoria,
      estoque: parseInt(estoque),
      lote,
      departamento,
      marketId,
      fabricacao,
      validade,
      imagem: imagempath,
    };

    insert("products", [
      "marketId", "name", "price", "category", "departament",
      "stock", "lot", "expirationDate", "manufactureDate",
      "barcode", "image"
    ], [
      produto.marketId,
      produto.nome,
      produto.preco,
      produto.categoria,
      produto.departamento,
      produto.estoque,
      produto.lote,
      produto.validade,
      produto.fabricacao,
      produto.codigo,
      produto.imagem,
    ]);

    res.status(200).json({ mensagem: "Produto adicionado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao adicionar produto." });
  }
});

// -------------------------------------------------
// Endpoint para deletar produto (já existente)
// -------------------------------------------------
app.post('/deletarProduto', async (req, res) => {
  const { codigo } = req.body;
  if (!codigo) {
    return res.status(400).json({ erro: "Código do produto não fornecido." });
  }
  try {
    delet("products", `productId = '${codigo}'`);
    res.status(200).json({ mensagem: "Produto deletado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao deletar produto." });
  }
});

// -------------------------------------------------
// Rotas de Carrinho e Finalizar compra (existentes)
// -------------------------------------------------
app.get('/getCarrinho', (req, res) => {
  const carrinho = req.cookies.carrinho || {};
  res.json({ carrinho });
});

app.post('/finalizarCompra', async (req, res) => {
  try {
    const { items, total, paymentMethod, marketId } = req.body;
    if (!items || !total || !paymentMethod || !marketId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const saleDate = new Date().toISOString();
    await insert('sales', [
      'marketId',
      'total',
      'paymentMethod',
      'saleDate'
    ], [
      marketId,
      total,
      paymentMethod,
      saleDate
    ]);

    const sales = await select('sales', 'WHERE saleDate = ? ORDER BY saleId DESC LIMIT 1', [saleDate]);
    if (!sales || sales.length === 0) {
      throw new Error('Failed to retrieve sale ID');
    }
    const saleId = sales[0].saleId;

    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice || !item.subtotal) {
        console.warn('Invalid item structure:', item);
        continue;
      }
      await insert('sale_items', [
        'saleId',
        'productId',
        'quantity',
        'unitPrice',
        'subtotal'
      ], [
        saleId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.subtotal
      ]);

      const product = await select('products', 'WHERE productId = ?', [item.productId]);
      if (product.length > 0) {
        const currentStock = product[0].stock;
        if (currentStock > 0) {
          const newStock = currentStock - item.quantity;
          await update('products', ['stock'], [newStock], `productId = ${item.productId}`);
        }
      } else {
        console.warn(`Product not found: ${item.productId}`);
      }
    }

    res.clearCookie('carrinho');
    res.json({ success: true, saleId });
  } catch (err) {
    console.error('Error processing sale:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

// -------------------------------------------------
// Endpoint para listar produtos (existente)
// -------------------------------------------------
app.post('/estoqueData', async (req, res) => {
  const { busca, category, marketId } = req.body;
  if (!marketId) {
    return res.status(400).json({ erro: "marketId é obrigatório" });
  }
  const marketIdSafe = marketId.replace(/'/g, "''");
  let buscaSafe = busca ? busca.replace(/'/g, "''") : null;
  let categorySafe = category ? category.replace(/'/g, "''") : null;
  let conditions = [`marketId = '${marketIdSafe}'`];
  if (buscaSafe) {
    conditions.push(`(name LIKE '%${buscaSafe}%' OR productId LIKE '%${buscaSafe}%' OR barcode = '${buscaSafe}')`);
  }
  if (categorySafe) {
    conditions.push(`category = '${categorySafe}'`);
  }
  const condicao = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const results = await select("products", condicao);
    res.status(200).json({ mensagem: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao consultar estoque." });
  }
});

// -------------------------------------------------
// Endpoints de Setors (existentes)
// -------------------------------------------------
app.post('/getSetor', async (req, res) => {
  try {
    const cats = await select("setors", "WHERE type = 'cat'");
    const depts = await select("setors", "WHERE type = 'dept'");
    const response = {
      cat: cats.map(item => item.name),
      dept: depts.map(item => item.name)
    };
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao consultar setores." });
  }
});

app.post('/addSetor', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ erro: "Nome e tipo são obrigatórios." });
  }
  const nomeSanitizado = name.replace(/'/g, "''");
  const tipoSanitizado = type === 'dept' ? 'dept' : 'cat';
  const columns = ['name', 'type', 'marketId'];
  const values = [nomeSanitizado, tipoSanitizado, 1];
  try {
    insert('setors', columns, values);
    res.status(200).json({ mensagem: "Setor adicionado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao adicionar setor." });
  }
});

app.post('/deleteSetor', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ erro: "Nome e tipo são obrigatórios." });
  }
  const nomeSanitizado = name.replace(/'/g, "''");
  const tipoSanitizado = type === 'dept' ? 'dept' : 'cat';
  const condicao = `name = '${nomeSanitizado}' AND type = '${tipoSanitizado}'`;
  try {
    delet('setors', condicao);
    res.status(200).json({ mensagem: "Setor excluído com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao excluir setor." });
  }
});

// -------------------------------------------------
// Rota para editar produto (existente, duplicado removido)
// -------------------------------------------------
app.post("/editarProduto", (req, res) => {
  const {
    productId,
    name,
    price,
    category,
    departament,
    stock,
    lot,
    expirationDate,
    manufactureDate,
    barcode,
    marketId
  } = req.body;

  const columns = [
    "name", "price", "category", "departament", "stock",
    "lot", "expirationDate", "manufactureDate", "barcode", "marketId"
  ];
  const values = [
    name, price, category, departament, stock,
    lot, expirationDate, manufactureDate, barcode, marketId
  ];
  const condition = `productId = ${productId}`;
  update("products", columns, values, condition);
  res.json({ success: true, message: "Produto atualizado com sucesso!" });
});

// -------------------------------------------------
// Rota de Cadastro de Usuário (existente)
// -------------------------------------------------
app.post("/cadastro", async (req, res) => {
  const { name, password, gestor } = req.body;
  if (!name || !password) {
    return res.status(400).json({
      status: "error",
      message: "Todos os campos são obrigatórios."
    });
  }
  try {
    const existingAccount = await select("users", "WHERE name = ?", [name]);
    if (existingAccount.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Usuário já existente!"
      });
    }
    await insert("users", ["name", "password", "gestor"], [name, password, gestor]);
    const users = await select("users", "WHERE name = ?", [name]);
    const user = users[0];
    res.status(200).json({
      status: "success",
      message: "Usuário cadastrado com sucesso.",
      userId: user.userId,
      name: user.name,
      gestor: user.gestor
    });
  } catch (err) {
    console.error("Erro no cadastro:", err);
    res.status(500).json({
      status: "error",
      message: "Erro ao cadastrar usuário."
    });
  }
});

// -------------------------------------------------
// Rota para login com ID (ajustada para profileImage)
// -------------------------------------------------
app.post("/loginWithId", async (req, res) => {
  let { id } = req.body;
  try {
    let user = await select("users", "WHERE userId = ?", [id]);
    if (!user || user.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }
    user = user[0];
    res.status(200).json({
      status: "success",
      id: user.userId,
      name: user.name,
      gestor: user.gestor,
      profileImage: user.profileImage
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
});

// -------------------------------------------------
// Rota de login (ajustada para profileImage)
// -------------------------------------------------
app.post('/login', async (req, res) => {
  let { name, senha } = req.body;
  try {
    const users = await select("users", "WHERE name = ?", [name]);
    if (users.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Usuário não cadastrado!"
      });
    }
    const user = users[0];
    if (senha !== user.password) {
      return res.status(401).json({
        status: "error",
        message: "Senha incorreta!"
      });
    }
    res.status(200).json({
      status: "success",
      id: user.userId,
      name: user.name,
      userId: user.userId,
      gestor: user.gestor,
      profileImage: user.profileImage
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({
      status: "error",
      message: "Erro no servidor."
    });
  }
});

// -------------------------------------------------
// Rotas de Perfis: Upload e Remoção de Imagem
// -------------------------------------------------

// Upload de nova foto de perfil
app.post(
  "/uploadProfileImage",
  uploadProfile.single("profileImage"),
  async (req, res) => {
    try {
      // 1) Validar userId
      const userId = req.body.userId;
      if (!userId) {
        console.error("[UPLOAD] Falta userId no body");
        return res
          .status(400)
          .json({ status: "error", message: "UserId não fornecido" });
      }

      // 2) Verificar se multer trouxe o arquivo
      if (!req.file) {
        console.error("[UPLOAD] req.file está undefined");
        return res
          .status(400)
          .json({ status: "error", message: "Nenhum arquivo enviado" });
      }
      console.log("[UPLOAD] Arquivo recebido:", req.file.filename);

      // 3) Remover foto antiga, se existir
      const rows = await select("users", "WHERE userId = ?", [userId]);
      if (rows && rows.length > 0) {
        const oldPath = rows[0].profileImage;
        if (oldPath) {
          const fullOldPath = path.join(__dirname, oldPath);
          console.log("[UPLOAD] Tentando remover foto antiga em:", fullOldPath);
          if (fs.existsSync(fullOldPath)) {
            fs.unlinkSync(fullOldPath);
            console.log("[UPLOAD] Foto antiga removida");
          } else {
            console.log("[UPLOAD] Foto antiga não encontrada");
          }
        }
      } else {
        console.warn(`[UPLOAD] Nenhum usuário encontrado com userId = ${userId}`);
      }

      // 4) Construir caminho relativo correto para salvar no banco
      const rawPath = req.file.path;
      let relativePath = path.relative(__dirname, rawPath).replace(/\\/g, "/");
      console.log("[UPLOAD] Caminho relativo para DB:", relativePath);

      // 5) Atualizar no banco (com aspas simples em torno de userId)
      const condition = `userId = '${userId}'`;
      console.log(`[UPLOAD] UPDATE users SET profileImage = ? WHERE ${condition}`);
      await update("users", ["profileImage"], [relativePath], condition);
      console.log("[UPLOAD] UPDATE concluído com sucesso");

      // 6) Responder ao cliente
      return res.status(200).json({
        status: "success",
        profileImage: relativePath,
      });
    } catch (err) {
      console.error("Erro em /uploadProfileImage:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Erro interno no servidor" });
    }
  }
);

// Remover foto de perfil
app.post("/removeProfileImage", async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ status: "error", message: "UserId não fornecido" });
    }

    // Buscar e remover do disco, se existir
    const rows = await select("users", "WHERE userId = ?", [userId]);
    if (rows && rows.length > 0) {
      const oldPath = rows[0].profileImage;
      if (oldPath) {
        const fullOldPath = path.join(__dirname, oldPath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }
    }

    // Atualizar para null no banco
    await update("users", ["profileImage"], [null], `userId = '${userId}'`);

    return res.status(200).json({ status: "success", message: "Imagem removida" });
  } catch (err) {
    console.error("Erro em /removeProfileImage:", err);
    return res.status(500).json({ status: "error", message: "Erro interno no servidor" });
  }
});

// -------------------------------------------------
// Outras rotas (Supermercados, Relatórios, etc.)
// -------------------------------------------------
const generateMarketId = async () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let marketId;
  const generateRandomId = () => {
    return Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  };
  let isUnique = false;
  while (!isUnique) {
    marketId = generateRandomId();
    const existing = await new Promise((resolve, reject) => {
      db.get("SELECT marketId FROM supermarkets WHERE marketId = ?", [marketId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!existing) {
      isUnique = true;
    }
  }
  return marketId;
};

app.post("/adicionarSupermercado", async (req, res) => {
  const { nome, local, ownerId, icon } = req.body;
  var search = await select("supermarkets", `WHERE name = ?`, [nome]);
  if (search.length > 0) return res.status(400).json({ erro: "Supermercado já existente" });

  try {
    const marketId = await generateMarketId();
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO supermarkets (marketId, name, local, ownerId, icon, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [marketId, nome, local, ownerId, icon, new Date().toISOString()],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const baseUrl = `http://localhost:${port}`;
    const pdvLink = `${baseUrl}/pdv/${marketId}`;
    const estoqueLink = `${baseUrl}/estoque/${marketId}`;

    res.status(201).json({
      success: true,
      data: {
        marketId,
        pdvLink,
        estoqueLink,
        nome,
        local,
        icon
      }
    });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post('/deletarSupermercado', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ erro: "Nome do mercado não fornecido." });
  }
  try {
    delet("supermarkets", `marketId = '${id}'`);
    res.status(200).json({ mensagem: "Supervisor deletado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao deletar supermercado." });
  }
});

app.post('/supermercadoData', async (req, res) => {
  const { busca } = req.body;
  let condicao = "";
  if (busca) {
    const termo = busca.replace(/'/g, "''");
    condicao = `WHERE ownerId = ${termo}`;
  }
  try {
    const results = await select("supermarkets", condicao);
    res.status(200).json({ mensagem: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao consultar supermercados." });
  }
});

app.post('/updateSupermercado', async (req, res) => {
  if (req.body) {
    const { id, nome, local, icon } = req.body;
    const columns = ["name", "local", "icon"];
    const values = [nome, local, icon];
    const condition = `marketId = "${id}"`;
    update("supermarkets", columns, values, condition);
    res.json({ success: true, message: "Supermercado atualizado com Sucesso!" });
  }
});

app.post('/addCarrinho', async (req, res) => {
  const carrinho = req.body;
  if (!carrinho) {
    res.status(400).send('Dados não recebidos');
  }
  res.cookie('carrinho', carrinho, {
    maxAge: 900000,
    httpOnly: true,
  });
  res.status(200).json({ mensagem: carrinho });
});

app.post('/getMarketId', async (req, res) => {
  const code = req.body;
  console.log(code);
  query(`SELECT marketd FROM superMarkets WHERE marketid == '${code}'`);
});

app.post("/verific", async (req, res) => {
  const { busca, column, tableSelect } = req.body;
  let condicao = "";
  if (busca && column) {
    const termo = busca.replace(/'/g, "''");
    condicao = `WHERE ${column.replace(/'/g, "''")} = ${termo}`;
  }
  try {
    const results = await select(tableSelect, condicao);
    res.status(200).json({ mensagem: results });
  } catch (e) {
    console.log(e);
  }
});

app.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const users = await select("users", "WHERE userId = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }
    const user = users[0];
    res.status(200).json({
      status: "success",
      data: {
        userId: user.userId,
        name: user.name,
        gestor: user.gestor,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
});

app.get("/Error404", (req, res) => {
  const pathError = `${webpages_dir}/erro404/index.html`;
  res.sendFile(pathError);
});

loadPages();

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor iniciado na porta http://localhost:${port}`);
});
