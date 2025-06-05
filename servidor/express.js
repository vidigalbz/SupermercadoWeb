const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cookieParser = require('cookie-parser');

const { select, insert, update, delet, query } = require("./database.js");

const app = express();
const port = 4000;

const { db } = require('./database.js');

const webpages_dir = path.join(__dirname, "../webpages");
var pages = [];

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: ('servidor/uploads'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `imagem-${Date.now()}.${ext}`);
  }
});
const upload = multer({ storage: storage });

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
    const ext = file.originalname.split(".").pop();
    cb(null, `profile-${userId}-${Date.now()}.${ext}`);
  }
});
const uploadProfile = multer({ storage: profileStorage });

app.use('/servidor/uploads', express.static(path.resolve(__dirname, './uploads')));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

const os = require('os');
const status = require("statuses");
const { table } = require("console");

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

app.post("/adicionarProduto", upload.single("imagem"), async (req, res) => {
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

    if (!nome || !codigo || !preco || !categoria || !estoque || !lote || !departamento || !marketId || !fabricacao || !validade) {
      return res.status(400).json({ erro: "Campos obrigatórios estão ausentes." });
    }

    insert("products", [
      "marketId", "name", "price", "category", "departament",
      "stock", "lot", "expirationDate", "manufactureDate",
      "barcode", "image"
    ], [
      marketId,
      nome,
      parseFloat(preco),
      categoria,
      departamento,
      parseInt(estoque),
      lote,
      validade,
      fabricacao,
      codigo,
      imagempath
    ]);

    res.status(200).json({ mensagem: "Produto adicionado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao adicionar produto." });
  }
});

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

app.get('/getCarrinho', (req, res) => {
  const carrinho = req.cookies.carrinho || {};
  res.json({ carrinho });
});

app.post('/finalizarCompra', async (req, res) => {
  try {
    const { items, total, paymentMethod, marketId } = req.body;

    // Validate required fields
    if (!items || !total || !paymentMethod || !marketId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Create sale record
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

    // 2. Get the sale ID
    const sales = await select('sales', 'WHERE saleDate = ? ORDER BY saleId DESC LIMIT 1', [saleDate]);
    if (!sales || sales.length === 0) {
      throw new Error('Failed to retrieve sale ID');
    }

    const saleId = sales[0].saleId;

    // 3. Add sale items and update inventory
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice || !item.subtotal) {
        console.warn('Invalid item structure:', item);
        continue;
      }

      // Insert sale item
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

      // Update stock and log history
      const product = await select('products', 'WHERE productId = ?', [item.productId]);
      if (product.length > 0) {
        const currentStock = product[0].stock;
        if (currentStock > 0) {
          const newStock = currentStock - item.quantity;
          await update('products', ['stock'], [newStock], `productId = ${item.productId}`);

          // Add to history
          await insert('history', [
            'productId',
            'marketId',
            'type',
            'beforeData',
            'afterData',
            'date'
          ], [
            item.productId,
            marketId,
            'saida',
            JSON.stringify({ stock: currentStock }),
            JSON.stringify({ stock: newStock }),
            new Date().toISOString()
          ]);
        }
      } else {
        console.warn(`Product not found: ${item.productId}`);
      }
    }

    // Clear cart cookie
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

  const condicao = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";

  try {
    const results = await select("products", condicao);
    res.status(200).json({ mensagem: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao consultar estoque." });
  }
});

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
  insert('setors', ['name','type','marketId'], [nomeSanitizado, tipoSanitizado, 1]);
  res.status(200).json({ mensagem: "Setor adicionado com sucesso!" });
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

app.post("/editarProduto", async (req, res) => {
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

    try {
        // Buscar dados antigos do produto
        const oldData = await select("products", "WHERE productId = ?", [productId]);

        if (!oldData || oldData.length === 0) {
            return res.status(404).json({ success: false, message: "Produto não encontrado." });
        }

        const beforeData = oldData[0]; // produto antes da edição

        const columns = [
            "name", "price", "category", "departament", "stock",
            "lot", "expirationDate", "manufactureDate", "barcode", "marketId"
        ];

        const values = [
            name, price, category, departament, stock,
            lot, expirationDate, manufactureDate, barcode, marketId
        ];

        const condition = `productId = ${productId}`;

        // Atualizar o produto
        await update("products", columns, values, condition);

        // Registrar histórico
        const afterData = {
            name, price, category, departament, stock,
            lot, expirationDate, manufactureDate, barcode, marketId
        };

        const historyEntry = {
            productId,
            marketId,
            type: 'edicao',
            beforeData: JSON.stringify(beforeData),
            afterData: JSON.stringify(afterData),
            date: new Date().toISOString()
        };

        await insert("history", [
            "productId",
            "marketId",
            "type",
            "beforeData",
            "afterData",
            "date"
        ], [
            historyEntry.productId,
            historyEntry.marketId,
            historyEntry.type,
            historyEntry.beforeData,
            historyEntry.afterData,
            historyEntry.date
        ]);

        res.json({ success: true, message: "Produto atualizado com sucesso!" });

    } catch (err) {
        console.error("Erro ao editar produto:", err);
        res.status(500).json({ success: false, message: "Erro interno ao editar produto." });
    }
});

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
    insert("users", ["name","password","gestor"], [name,password,gestor]);
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
      profileImage: user.profileImage || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
});

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
      profileImage: user.profileImage || null
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({
      status: "error",
      message: "Erro no servidor."
    });
  }
});

app.post(
  "/uploadProfileImage",
  uploadProfile.single("profileImage"),
  async (req, res) => {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ status: "error", message: "UserId não fornecido" });
      }
      if (!req.file) {
        return res.status(400).json({ status: "error", message: "Nenhum arquivo enviado" });
      }

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

      const relativePath = path.relative(__dirname, req.file.path).replace(/\\/g, "/");
      await update("users", ["profileImage"], [relativePath], `userId = '${userId}'`);

      return res.status(200).json({
        status: "success",
        profileImage: relativePath
      });
    } catch (err) {
      console.error("Erro em /uploadProfileImage:", err);
      return res.status(500).json({ status: "error", message: "Erro interno no servidor" });
    }
  }
);

app.post("/removeProfileImage", async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ status: "error", message: "UserId não fornecido" });
    }

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

    await update("users", ["profileImage"], [null], `userId = '${userId}'`);
    return res.status(200).json({ status: "success", message: "Imagem removida" });
  } catch (err) {
    console.error("Erro em /removeProfileImage:", err);
    return res.status(500).json({ status: "error", message: "Erro interno no servidor" });
  }
});

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
    res.status(200).json({ mensagem: "Supermercado deletado com sucesso!" });
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
    return res.status(400).send('Dados não recebidos');
  }
  res.cookie('carrinho', carrinho, {
    maxAge: 900000,
    httpOnly: true,
  });
  res.status(200).json({ mensagem: carrinho });
});

app.post('/getMarketId', async (req, res) => {
  const code = req.body;
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

app.post("/funcionarios", async (req, res) => {
  const {marketId, userId} = req.body;
  if (marketId && !userId){
    const funcionarios = await select("user_permissions", "WHERE marketId = ?", [marketId])
    if (funcionarios.length > 0){
      return res.status(200).json({
        status: "success",
        message: funcionarios
      })
    }
    else {
      return res.status(404).json({
        status: "error",
        status: "nenhum funcionario encontrado!"
      })
    }
  }

})

app.post("/atualizarFuncionario", async (req, res) => {
  const {type, userData, marketId} = req.body;

  if (type == "update"){
    try {
      await update('user_permissions', ['pdv', 'estoque','fornecedor', 'relatorios', 'alertas', 'rastreamento'], userData.permissoes, `userid = ${userData.userId} AND marketId = '${marketId}'`); 
      res.status(200).json({
        status: "success",
        message: "Permissões Atualizadas!"
      })
    }
    catch {
      res.status(404).json({
        status: "error",
        message: "Erro ao atualizar usuário"
      })
    }
    
  }
  else if (type == "delete"){
    try {
      await delet("user_permissions", `userId = '${userData.userId}' AND marketId = '${marketId}'`);
      console.log("usuario removido!")
      res.status(200).json({
        status: "success",
        message: "Erro ao remover Funcionario!"
      })
    }
    catch {
      res.status(404).json({
        status: "error",
        message: "Erro ao remover usuário"
      })
    }
  }
  else if (type == "insert") {
    try {
      tableData = await select("user_permissions", "WHERE userId = ? AND marketId = ?", [userData.userId, marketId])
      if (tableData.length > 0) {
        console.log("Usuário já cadastrado!")
        return res.status(409).json({
          status: "error",
          message: "Usuário já cadastrado!"
        });
      }
      else {
        insert(
          "user_permissions", 
          ["userId", "marketId", "pdv", "estoque", "fornecedor", "relatorios", "alertas", "rastreamento"], 
          [userData.userId, marketId, userData.permissoes[0], userData.permissoes[1], userData.permissoes[2], userData.permissoes[3], userData.permissoes[4], userData.permissoes[5]]
        );

        return res.status(200).json({
          status: "success",
          message: "Funcionário cadastrado com sucesso!"
        });
      }
    } catch (err) {
      console.error("Erro ao adicionar usuário:", err);
        return res.status(500).json({
          status: "error",
          message: "Erro interno ao adicionar funcionário"
        });
      }
  }
})

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
        profileImage: user.profileImage || null
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
