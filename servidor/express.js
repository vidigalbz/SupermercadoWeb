const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cookieParser = require('cookie-parser');
const os = require('os');

// Import database functions
const { db, select, insert, update, delet, query, selectFromRaw } = require("./database.js");

const app = express();
const port = process.env.PORT || 4000;

const webpages_dir = path.join(__dirname, "../webpages");
console.log(`[DEBUG] Diretório de páginas web configurado para: ${webpages_dir}`);

let pages = []; // Array para armazenar nomes de diretórios de páginas

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos da pasta de páginas web
app.use(express.static(webpages_dir));

// Configuração de pastas de upload
const uploadsDir = path.join(__dirname, 'servidor/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/servidor/uploads', express.static(uploadsDir));

// Configuração do armazenamento de imagens de produtos
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `imagem-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extName) {
            return cb(null, true);
        }
        cb(new Error("Tipo de arquivo não permitido. Apenas imagens são aceitas."));
    }
});

// Configuração do armazenamento de imagens de perfil
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
        const ext = path.extname(file.originalname);
        cb(null, `profile-${userId}-${Date.now()}${ext}`);
    }
});
const uploadProfile = multer({ storage: profileStorage });
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads', 'profiles')));

/**
 * Função para obter o IP real na rede local (Wi-Fi ou LAN)
 */
function getRealWirelessIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (
                    iface.address.startsWith('192.168.') ||
                    iface.address.startsWith('172.16.') ||
                    iface.address.startsWith('10.')
                ) {
                    return iface.address;
                }
            }
        }
    }
    return 'localhost';
}

app.get('/api/ip', (req, res) => {
    const ip = getRealWirelessIP();
    res.json({ ip });
});

/**
 * Carrega dinamicamente as páginas HTML em subpastas de "webpages"
 */
async function loadPages() {
    try {
        if (!fs.existsSync(webpages_dir)) {
            console.error(`[DEBUG] ERRO CRÍTICO: O diretório de páginas web NÃO EXISTE: ${webpages_dir}`);
            return;
        }

        const arquivos = await fs.promises.readdir(webpages_dir);
        console.log(`[DEBUG] Arquivos/Pastas encontrados em webpages_dir:`, arquivos);
        pages = [];

        for (const arquivo of arquivos) {
            const caminhoCompleto = path.join(webpages_dir, arquivo);
            try {
                const stat = await fs.promises.stat(caminhoCompleto);
                if (stat.isDirectory()) {
                    console.log(`[DEBUG] Encontrado diretório: ${arquivo}`);
                    pages.push(arquivo);
                }
            } catch (statErr) {
                console.error(`[DEBUG] Erro ao ler stats de ${caminhoCompleto}:`, statErr.message);
            }
        }

        console.log("[DEBUG] Pastas de páginas candidatas identificadas:", pages);

        pages.forEach(pageName => {
            const indexPath = path.join(webpages_dir, pageName, "index.html");
            console.log(`[DEBUG] Verificando ${pageName}: Tentando encontrar ${indexPath}`);

            if (fs.existsSync(indexPath)) {
                const routePath = (pageName.toLowerCase() === "main") ? "/" : `/${pageName}`;
                app.get(routePath, (req, res) => {
                    console.log(`[DEBUG] Rota ${routePath} acessada, servindo ${indexPath}`);
                    res.sendFile(indexPath);
                });
                console.log(`[DEBUG] ROTA CRIADA: ${routePath} -> ${indexPath}`);
            } else {
                console.log(`[DEBUG] ATENÇÃO: index.html não encontrado em ${path.join(webpages_dir, pageName)} para a pasta '${pageName}'. Nenhuma rota criada para /${pageName}.`);
            }
        });
    } catch (err) {
        console.error("[DEBUG] Erro CRÍTICO ao carregar páginas dinâmicas:", err);
    }
}

/**
 * Rota para adicionar produto
 */
app.post("/adicionarProduto", upload.single("imagem"), async (req, res) => {
    try {
        let imagemPathToStore = null;
        if (req.file) {
            imagemPathToStore = `servidor/uploads/${req.file.filename}`.replace(/\\/g, "/");
        } else {
            const { imagem: imagemUrl } = req.body;
            if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '') {
                imagemPathToStore = imagemUrl;
            }
        }

        const {
            nome, codigo, preco, categoria, estoque, lote,
            departamento, marketId, fabricacao, validade, userId
        } = req.body;

        if (
            !nome || !codigo || !preco || !categoria || !estoque ||
            !lote || !departamento || !marketId || !fabricacao || !validade || !userId
        ) {
          console.log(`${nome} || ${codigo} || ${preco} || ${categoria} || ${estoque} || ${lote} || ${departamento} || ${marketId} || ${fabricacao} || ${validade} || ${userId}`)
            return res.status(400).json({ erro: "Campos obrigatórios estão ausentes." });
        }

        const produto = {
            marketId,
            nome,
            codigo,
            preco: parseFloat(preco),
            categoria,
            departamento,
            estoque: parseInt(estoque),
            lote,
            fabricacao,
            validade,
            imagem: imagemPathToStore,
            userId: parseInt(userId)
        };

        // Insere produto
        const result = await insert("products", [
            "marketId", "name", "price", "category", "departament",
            "stock", "lot", "expirationDate", "manufactureDate",
            "barcode", "image"
        ], [
            produto.marketId, produto.nome, produto.preco, produto.categoria,
            produto.departamento, produto.estoque, produto.lote, produto.validade,
            produto.fabricacao, produto.codigo, produto.imagem
        ]);

        if (!result || result.id == null) {
            throw new Error("Falha ao inserir produto no banco de dados.");
        }
        const newProductId = result.id;

        // Insere histórico de entrada
        await insert("history", [
            "productId", "marketId", "userId", "type",
            "beforeData", "afterData", "createdAt"
        ], [
            newProductId, produto.marketId, produto.userId, "entrada",
            null,
            JSON.stringify({ stock: produto.estoque, price: produto.preco, name: produto.nome }),
            new Date().toISOString()
        ]);

        return res.status(201).json({ mensagem: "Produto adicionado com sucesso!", productId: newProductId });
    } catch (err) {
        console.error("Erro ao adicionar produto:", err);
        if (err.message && err.message.startsWith("Tipo de arquivo não permitido")) {
            return res.status(400).json({ erro: err.message });
        }
        return res.status(500).json({ erro: "Erro interno ao adicionar produto.", detalhes: err.message });
    }
});

/**
 * Rota para deletar produto
 */
app.post('/deletarProduto', async (req, res) => {
    const { productId, userId, marketId } = req.body;
    if (!productId || !userId || !marketId) {
        return res.status(400).json({ erro: "Parâmetros obrigatórios ausentes (productId, userId, marketId)." });
    }
    try {
        const produtos = await select("products", "WHERE productId = ? AND marketId = ?", [productId, marketId]);
        if (!produtos || produtos.length === 0) {
            return res.status(404).json({ erro: "Produto não encontrado neste mercado." });
        }
        const produtoDeletado = produtos[0];
        // Insere histórico de remoção
        await insert("history", [
            "productId", "marketId", "userId", "type",
            "beforeData", "afterData", "createdAt"
        ], [
            produtoDeletado.productId, produtoDeletado.marketId, parseInt(userId),
            "remocao", JSON.stringify(produtoDeletado), null,
            new Date().toISOString()
        ]);
        await delet("products", "productId = ? AND marketId = ?", [productId, marketId]);
        return res.status(200).json({ mensagem: "Produto deletado com sucesso!" });
    } catch (err) {
        console.error("Erro ao deletar produto:", err);
        return res.status(500).json({ erro: "Erro interno ao deletar produto.", detalhes: err.message });
    }
});

/**
 * Rota para obter carrinho do cookie
 */
app.get('/getCarrinho', (req, res) => {
    const carrinho = req.cookies.carrinho || {};
    res.json({ carrinho });
});

/**
 * Rota para finalizar compra
 */
app.post('/finalizarCompra', async (req, res) => {
    try {
        const { items, total, paymentMethod, marketId, userId } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Nenhum item na compra' });
        }
        if (!total || isNaN(parseFloat(total)) || parseFloat(total) <= 0) {
            return res.status(400).json({ error: 'Total inválido' });
        }
        if (!paymentMethod || !['cash', 'credit', 'debit', 'pix'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Método de pagamento inválido' });
        }
        if (!marketId || typeof marketId !== 'string') {
            return res.status(400).json({ error: 'ID do mercado inválido' });
        }
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'ID do usuário inválido' });
        }

        for (const item of items) {
            if (
                isNaN(parseInt(item.productId)) || parseInt(item.productId) <= 0 ||
                isNaN(parseInt(item.quantity)) || parseInt(item.quantity) <= 0 ||
                isNaN(parseFloat(item.unitPrice)) || parseFloat(item.unitPrice) < 0 ||
                isNaN(parseFloat(item.subtotal)) || parseFloat(item.subtotal) < 0
            ) {
                return res.status(400).json({ error: `Item inválido na compra: ${JSON.stringify(item)}` });
            }
        }

        // Verifica existência do mercado
        const marketExists = await select("supermarkets", "WHERE marketId = ?", [marketId]);
        if (marketExists.length === 0) {
            return res.status(400).json({ error: `Mercado com ID ${marketId} não existe.` });
        }

        await query("BEGIN TRANSACTION");
        const saleDate = new Date().toISOString();
        const saleResult = await insert("sales",
            ["marketId", "total", "paymentMethod", "saleDate"],
            [marketId, parseFloat(total), paymentMethod, saleDate]
        );
        const saleId = saleResult.id;
        if (!saleId) throw new Error('Falha ao registrar venda.');

        for (const item of items) {
            const products = await select("products",
                "WHERE productId = ? AND marketId = ?",
                [parseInt(item.productId), marketId]
            );
            if (products.length === 0) {
                await query("ROLLBACK");
                return res.status(400).json({ error: `Produto ${item.productId} não encontrado no mercado ${marketId}` });
            }
            const product = products[0];
            const currentStock = product.stock;
            if (currentStock < parseInt(item.quantity)) {
                await query("ROLLBACK");
                return res.status(400).json({ error: `Estoque insuficiente para produto ${product.name} (ID: ${item.productId})` });
            }
            const newStock = currentStock - parseInt(item.quantity);

            await insert("sale_items",
                ["saleId", "productId", "quantity", "unitPrice", "subtotal"],
                [saleId, parseInt(item.productId), parseInt(item.quantity), parseFloat(item.unitPrice), parseFloat(item.subtotal)]
            );
            await update("products",
                ["stock"], [newStock],
                "productId = ? AND marketId = ?", [parseInt(item.productId), marketId]
            );
            await insert("history", [
                "productId", "marketId", "userId", "type", "beforeData", "afterData", "createdAt"
            ], [
                parseInt(item.productId), marketId, parseInt(userId), 'saida',
                JSON.stringify({ stock: currentStock, price: product.price, name: product.name }),
                JSON.stringify({ stock: newStock }),
                new Date().toISOString()
            ]);
        }

        await query("COMMIT");
        res.clearCookie('carrinho');
        return res.status(201).json({ success: true, saleId, message: 'Compra finalizada com sucesso' });
    } catch (error) {
        await query("ROLLBACK").catch(rbError => console.error('Erro no rollback:', rbError));
        console.error('Erro ao processar /finalizarCompra:', error);
        return res.status(500).json({ error: 'Erro ao processar a compra', message: error.message });
    }
});

/**
 * Rota para consultar estoque
 */
app.post('/estoqueData', async (req, res) => {
    const { busca, category, marketId } = req.body;
    if (!marketId) {
        return res.status(400).json({ erro: "marketId é obrigatório" });
    }
    try {
        let conditions = ["marketId = ?"];
        const params = [marketId];
        if (busca && busca.trim() !== "") {
            conditions.push("(name LIKE ? OR productId LIKE ? OR barcode = ?)");
            const searchTerm = `%${busca.trim()}%`;
            params.push(searchTerm, searchTerm, busca.trim());
        }
        if (category && category.trim() !== "" && category.toLowerCase() !== "todos") {
            conditions.push("category = ?");
            params.push(category.trim());
        }
        const condicaoSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const results = await select("products", condicaoSQL, params);
        return res.status(200).json({ mensagem: results });
    } catch (err) {
        console.error("Erro ao consultar estoque:", err);
        return res.status(500).json({ erro: "Erro ao consultar estoque.", detalhes: err.message });
    }
});

/**
 * Rotas para gerenciamento de setores (setors)
 */
app.post('/getSetor', async (req, res) => {
    const { marketId } = req.body;
    if (!marketId) {
        return res.status(400).json({ success: false, error: "marketId é obrigatório" });
    }
    try {
        const cats = await select("setors", "WHERE type = 'cat' AND marketId = ?", [marketId]);
        const depts = await select("setors", "WHERE type = 'dept' AND marketId = ?", [marketId]);
        return res.status(200).json({
            success: true,
            cat: cats.map(item => item.name),
            dept: depts.map(item => item.name)
        });
    } catch (err) {
        console.error("Erro ao consultar setores:", err);
        return res.status(500).json({ success: false, error: "Erro interno ao consultar setores.", detalhes: err.message });
    }
});

app.post('/addSetor', async (req, res) => {
    const { name, type, marketId, userId } = req.body;
    if (!name || !type || !marketId || !userId) {
        return res.status(400).json({ success: false, error: "Todos os campos (name, type, marketId, userId) são obrigatórios." });
    }
    if (!['cat', 'dept'].includes(type)) {
        return res.status(400).json({ success: false, error: "Tipo de setor inválido. Use 'cat' ou 'dept'." });
    }
    try {
        const mercados = await select("supermarkets", "WHERE marketId = ? AND ownerId = ?", [marketId, parseInt(userId)]);
        if (mercados.length === 0) {
            return res.status(403).json({ success: false, error: "Você não tem permissão para adicionar setores neste mercado ou o mercado não existe." });
        }
        await insert('setors', ['name', 'type', 'marketId'], [name.trim(), type, marketId]);
        return res.status(201).json({ success: true, message: "Setor adicionado com sucesso!" });
    } catch (err) {
        console.error("Erro ao salvar setor:", err);
        if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({ success: false, error: "Este setor já existe neste mercado." });
        }
        return res.status(500).json({ success: false, error: "Erro interno ao salvar setor", detalhes: err.message });
    }
});

app.post('/deleteSetor', async (req, res) => {
    const { name, type, marketId, userId } = req.body;
    if (!name || !type || !marketId || !userId) {
        return res.status(400).json({ erro: "Nome, tipo, marketId e userId são obrigatórios." });
    }
    if (!['cat', 'dept'].includes(type)) {
        return res.status(400).json({ erro: "Tipo de setor inválido." });
    }
    try {
        const mercados = await select("supermarkets", "WHERE marketId = ? AND ownerId = ?", [marketId, parseInt(userId)]);
        if (mercados.length === 0) {
            return res.status(403).json({ erro: "Você não tem permissão para excluir setores deste mercado." });
        }
        const result = await delet('setors', "name = ? AND type = ? AND marketId = ?", [name, type, marketId]);
        if (result.changes > 0) {
            return res.status(200).json({ mensagem: "Setor excluído com sucesso!" });
        } else {
            return res.status(404).json({ erro: "Setor não encontrado ou já excluído." });
        }
    } catch (err) {
        console.error("Erro ao excluir setor:", err);
        return res.status(500).json({ erro: "Erro interno ao excluir setor.", detalhes: err.message });
    }
});

/**
 * Rota para editar produto
 */
app.post("/editarProduto", async (req, res) => {
    try {
        const {
            productId, name, price, category, departament, stock,
            lot, expirationDate, manufactureDate, barcode, marketId, userId
        } = req.body;
        if (
            !productId || !name || price == null || !category || !departament ||
            stock == null || !lot || !expirationDate || !manufactureDate || !barcode ||
            !marketId || !userId
        ) {
            return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios." });
        }
        const oldDataResult = await select("products", "WHERE productId = ? AND marketId = ?", [productId, marketId]);
        if (!oldDataResult || oldDataResult.length === 0) {
            return res.status(404).json({ success: false, message: "Produto não encontrado neste mercado." });
        }
        const beforeData = oldDataResult[0];
        const columnsToUpdate = [
            "name", "price", "category", "departament", "stock",
            "lot", "expirationDate", "manufactureDate", "barcode"
        ];
        const valuesToUpdate = [
            name, parseFloat(price), category, departament, parseInt(stock),
            lot, expirationDate, manufactureDate, barcode
        ];
        await update("products", columnsToUpdate, valuesToUpdate, "productId = ? AND marketId = ?", [productId, marketId]);
        const afterData = {
            name,
            price: parseFloat(price),
            category,
            departament,
            stock: parseInt(stock),
            lot,
            expirationDate,
            manufactureDate,
            barcode,
            marketId
        };
        await insert("history", [
            "productId", "marketId", "userId", "type",
            "beforeData", "afterData", "createdAt"
        ], [
            productId, marketId, parseInt(userId), "edicao",
            JSON.stringify(beforeData), JSON.stringify(afterData),
            new Date().toISOString()
        ]);
        return res.json({ success: true, message: "Produto atualizado com sucesso!" });
    } catch (err) {
        console.error("Erro ao editar produto:", err);
        return res.status(500).json({ success: false, message: "Erro interno ao editar produto.", detalhes: err.message });
    }
});

/**
 * Rota de cadastro de usuário
 */
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

/**
 * Rota de login por e-mail
 */
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

/**
 * Rota de login por ID (cliente interno)
 */
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

/**
 * Rota para upload de imagem de perfil
 */
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

/**
 * Rota para remover imagem de perfil
 */

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

/**
 * Geração de um marketId único
 */
const generateMarketId = async () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let marketIdCandidate;
    let isUnique = false;
    while (!isUnique) {
        marketIdCandidate = Array.from({ length: 6 }, () =>
            chars[Math.floor(Math.random() * chars.length)]
        ).join("");
        const existing = await select("supermarkets", "WHERE marketId = ?", [marketIdCandidate]);
        if (existing.length === 0) {
            isUnique = true;
        }
    }
    return marketIdCandidate;
};

/**
 * Rota para adicionar supermercado
 */
app.post("/adicionarSupermercado", async (req, res) => {
    const { nome, local, ownerId: ownerIdString, icon } = req.body;

    if (!nome || !local || !ownerIdString || !icon) {
        return res.status(400).json({ erro: "Campos obrigatórios (nome, local, ownerId, icon) estão ausentes." });
    }

    const ownerId = parseInt(ownerIdString);
    if (isNaN(ownerId)) {
        return res.status(400).json({ erro: "ID do proprietário inválido." });
    }

    try {
        // Verifica duplicidade de nome para este ownerId
        const search = await select("supermarkets", "WHERE name = ? AND ownerId = ?", [nome, ownerId]);
        console.log(`[ADDSUPER] Verificando duplicidade para nome '${nome}' e ownerId ${ownerId}:`, search);

        if (search.length > 0) {
            return res.status(400).json({ erro: "Você já possui um supermercado com este nome." });
        }

        const marketId = await generateMarketId();
        const createdAt = new Date().toISOString();

        await insert("supermarkets",
            ["marketId", "name", "local", "ownerId", "icon", "createdAt"],
            [marketId, nome.trim(), local.trim(), ownerId, icon, createdAt]
        );

        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        const pdvLink = `${baseUrl}/pdv/?id=${marketId}`;
        const estoqueLink = `${baseUrl}/estoque/?id=${marketId}`;

        return res.status(201).json({
            success: true,
            message: "Supermercado adicionado com sucesso!",
            data: {
                marketId,
                name: nome.trim(),
                local: local.trim(),
                icon,
                ownerId,
                pdvLink,
                estoqueLink
            }
        });
    } catch (err) {
        console.error("[ADDSUPER] Erro ao adicionar supermercado:", err);
        return res.status(500).json({
            success: false,
            error: "Erro interno ao adicionar supermercado.",
            details: err.message
        });
    }
});

/**
 * Rota para listar supermercados por ownerId
 */
app.post('/listarSupermercados', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: "O userId é obrigatório." });
    }
    try {
        const userIdInt = parseInt(userId);
        if (isNaN(userIdInt)) {
            return res.status(400).json({ success: false, error: "Formato de userId inválido." });
        }
        const supermarkets = await select("supermarkets", "WHERE ownerId = ?", [userIdInt]);
        return res.status(200).json({ success: true, data: supermarkets });
    } catch (err) {
        console.error("HISTORICO - Erro ao listar supermercados (backend):", err);
        return res.status(500).json({ success: false, error: "Erro interno ao listar supermercados." });
    }
});

/**
 * Rota para deletar supermercado (por marketId e ownerId)
 */
app.post('/deletarSupermercado', async (req, res) => {
    const { marketId, ownerId } = req.body;
    if (!marketId || !ownerId) {
        return res.status(400).json({ erro: "marketId e ownerId do proprietário são obrigatórios." });
    }
    try {
        const result = await delet("supermarkets", "marketId = ? AND ownerId = ?", [marketId, parseInt(ownerId)]);
        if (result.changes > 0) {
            return res.status(200).json({ mensagem: "Supermercado deletado com sucesso!" });
        } else {
            return res.status(404).json({ erro: "Supermercado não encontrado ou você não tem permissão para deletá-lo." });
        }
    } catch (err) {
        console.error("Erro ao deletar supermercado:", err);
        return res.status(500).json({ erro: "Erro interno ao deletar supermercado.", detalhes: err.message });
    }
});

/**
 * Rota para buscar supermercados por ownerId (campo 'busca' no corpo)
 */
app.post('/supermercadoData', async (req, res) => {
    const { busca } = req.body; // 'busca' deve ser ownerId
    if (!busca) {
        return res.status(400).json({ erro: "ID do proprietário (busca) é obrigatório.", mensagem: [] });
    }
    const ownerId = parseInt(busca);
    if (isNaN(ownerId)) {
        return res.status(400).json({ erro: "ID do proprietário fornecido é inválido.", mensagem: [] });
    }
    try {
        const results = await select("supermarkets", "WHERE ownerId = ?", [ownerId]);
        return res.status(200).json({ mensagem: results });
    } catch (err) {
        console.error("Erro ao consultar supermercados:", err);
        return res.status(500).json({ erro: "Erro ao consultar supermercados." });
    }
});

/**
 * Rota para atualizar dados de supermercado (por marketId e ownerId)
 */
app.post('/updateSupermercado', async (req, res) => {
    const { id: marketId, nome, local, icon, ownerId } = req.body;
    if (!marketId || !ownerId) {
        return res.status(400).json({ success: false, message: "marketId e ownerId são obrigatórios." });
    }
    if (!nome && !local && !icon) {
        return res.status(400).json({ success: false, message: "Nenhum dado para atualizar." });
    }
    try {
        const columns = [];
        const values = [];
        if (nome) { columns.push("name"); values.push(nome); }
        if (local) { columns.push("local"); values.push(local); }
        if (icon) { columns.push("icon"); values.push(icon); }
        if (columns.length === 0) {
            return res.status(400).json({ success: false, message: "Nenhum campo válido para atualização fornecido." });
        }
        const result = await update("supermarkets", columns, values, "marketId = ? AND ownerId = ?", [marketId, parseInt(ownerId)]);
        if (result.changes > 0) {
            return res.json({ success: true, message: "Supermercado atualizado com sucesso!" });
        } else {
            return res.status(404).json({ success: false, message: "Supermercado não encontrado ou você não tem permissão para atualizá-lo." });
        }
    } catch (err) {
        console.error("Erro ao atualizar supermercado:", err);
        return res.status(500).json({ success: false, message: "Erro interno ao atualizar supermercado.", detalhes: err.message });
    }
});

/**
 * Rota para adicionar o carrinho ao cookie
 */
app.post('/addCarrinho', async (req, res) => {
    const carrinhoData = req.body.carrinho;
    if (!carrinhoData) {
        return res.status(400).send('Dados do carrinho não recebidos corretamente.');
    }
    res.cookie('carrinho', carrinhoData, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    });
    return res.status(200).json({ mensagem: "Carrinho atualizado nos cookies.", data: carrinhoData });
});

/**
 * Rota para obter detalhes de um usuário por userId
 */
app.post('/api/getUserDetails', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: "O userId é obrigatório." });
    }
    try {
        const users = await select("users", "WHERE userId = ?", [parseInt(userId)]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: "Usuário não encontrado." });
        }
        const { name, email } = users[0];
        // Retorna 'mensagem' como um array contendo um objeto para compatibilidade com frontend
        return res.status(200).json({ success: true, mensagem: [{ name, email }] });
    } catch (err) {
        console.error("Erro ao buscar detalhes do usuário:", err);
        return res.status(500).json({ success: false, error: "Erro interno ao buscar detalhes do usuário." });
    }
});

/**
 * Rota para verificar se um supermercado existe por marketId
 */
app.post('/verific', async (req, res) => {
    try {
        const { marketId } = req.body;
        if (!marketId || typeof marketId !== "string" || marketId.trim() === "") {
            return res.status(400).json({ success: false, message: "marketId não fornecido ou inválido." });
        }
        const result = await select('supermarkets', 'WHERE marketId = ?', [marketId.trim()]);
        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, message: "Supermercado não encontrado." });
        }
        return res.status(200).json({ success: true, market: result[0] });
    } catch (err) {
        console.error("Erro ao verificar supermercado:", err);
        return res.status(500).json({ success: false, message: "Erro interno ao verificar supermercado.", detalhes: err.message });
    }
});

/**
 * Rota para listar funcionários por marketId (quando userId não é fornecido)
 */
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

/**
 * Rota para gerenciar funcionários (insert, update e delete em user_permissions)
 */
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
});

/**
 * Rota para buscar usuário por userId (GET)
 */
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

/**
 * Rota de página 404 customizada
 */
app.get("/Error404", (req, res) => {
    const pathError = path.join(webpages_dir, "erro404", "index.html");
    if (fs.existsSync(pathError)) {
        return res.status(404).sendFile(pathError);
    } else {
        console.log(`[DEBUG] Arquivo de erro404 não encontrado em: ${pathError}`);
        return res.status(404).send("<h1>404 - Página não encontrada</h1><p>E a página de erro customizada também não foi encontrada.</p>");
    }
});

/**
 * Rota para buscar dados de histórico de mudanças
 */
app.post('/historicoData', async (req, res) => {
    const { userId, marketId, busca, categoria } = req.body;
    if (!userId || !marketId) {
        return res.status(400).json({ success: false, error: "Parâmetros 'userId' e 'marketId' são obrigatórios" });
    }
    try {
        const mercados = await select("supermarkets", "WHERE marketId = ? AND ownerId = ?", [marketId, parseInt(userId)]);
        if (!mercados || mercados.length === 0) {
            return res.status(403).json({ success: false, error: "Acesso não autorizado a este supermercado ou supermercado não existe." });
        }
        let conditions = ["h.marketId = ?"];
        const params = [marketId];
        if (busca && busca.trim() !== '') {
            conditions.push("(p.name LIKE ? OR p.barcode = ? OR h.productId LIKE ?)");
            const searchTerm = `%${busca.trim()}%`;
            params.push(searchTerm, busca.trim(), searchTerm);
        }
        const typeMap = { entrada: "entrada", saida: "saida", alteracao: "edicao", remocao: "remocao" };
        if (categoria && typeMap[categoria]) {
            conditions.push("h.type = ?");
            params.push(typeMap[categoria]);
        }
        const sql = `
            SELECT
                h.historyId, h.productId, h.marketId, h.type,
                COALESCE(h.beforeData, '{}') as beforeData,
                COALESCE(h.afterData, '{}') as afterData,
                h.createdAt as date,
                COALESCE(p.name, (
                    CASE
                        WHEN h.type = 'remocao' THEN JSON_EXTRACT(h.beforeData, '$.name')
                        WHEN h.type = 'entrada' THEN JSON_EXTRACT(h.afterData, '$.name')
                        WHEN h.type = 'edicao' THEN JSON_EXTRACT(h.afterData, '$.name')
                        ELSE 'Produto Detalhes Desconhecidos'
                    END
                )) as name,
                COALESCE(p.barcode, (
                    CASE
                        WHEN h.type = 'remocao' THEN JSON_EXTRACT(h.beforeData, '$.barcode')
                        ELSE NULL
                    END
                )) as barcode
            FROM history h
            LEFT JOIN products p ON h.productId = p.productId AND h.marketId = p.marketId
            WHERE ${conditions.join(" AND ")}
            ORDER BY h.createdAt DESC
            LIMIT 500
        `;
        const historico = await selectFromRaw(sql, params);
        const processed = historico.map(item => {
            try {
                return {
                    ...item,
                    beforeData: typeof item.beforeData === 'string' ? JSON.parse(item.beforeData || '{}') : (item.beforeData || {}),
                    afterData: typeof item.afterData === 'string' ? JSON.parse(item.afterData || '{}') : (item.afterData || {}),
                    date: item.date || new Date().toISOString()
                };
            } catch (e) {
                console.error("Erro ao parsear JSON no histórico:", e, "Item:", item);
                return { ...item, beforeData: { error: "parse_failed" }, afterData: { error: "parse_failed" } };
            }
        }).filter(Boolean);
        return res.json({ success: true, data: processed });
    } catch (err) {
        console.error("Erro no /historicoData:", err);
        return res.status(500).json({ success: false, error: "Erro interno ao processar histórico", detalhes: err.message });
    }
});

/**
 * Fornecedores
 */

app.post("/addFornecedor", (req, res) => {
    const {cnpj, 
        razao_social, 
        inscricao_estadual, 
        endereco, 
        contato,
        tipo_de_produto
    } = req.body
    try {   
        insert(
            "fornecedores", 
            ["cnpj", 
            "razao_social", 
            "inscricao_estadual", 
            "endereco", 
            "contato",
            "tipo_de_produto"],
            [cnpj, 
            razao_social, 
            inscricao_estadual, 
            endereco, 
            contato,
            tipo_de_produto]
        )
        res.json({
            status: "success"
        })
    } catch (error) {
        
    }
})

app.post("/fornecedorData", async (req, res) =>  {
    try{
        var data = await select("fornecedores")
        res.status(200).json({result: data})
    }
    catch(e) {
        res.status(500).json({erro: e})
    }

})

app.post("/editarFornecedor", async (req, res) => {
    const {
        cnpj,
        razaoSocial,
        inscricaoEstadual, 
        tipoProduto,
        endereco,
        contato,
    } = req.body

    try {
        update("fornecedores",
            ["cnpj", 
                "razao_social", 
                "inscricao_estadual", 
                "endereco", 
                "contato",
                "tipo_de_produto"],
            [
                cnpj, razaoSocial, inscricaoEstadual, endereco, contato, tipoProduto,
            ], `cnpj = ${cnpj}`
        )
    }catch (e) {
        res.status(500).json({ erro: "Não ocorreu como Devia ter ocorrido"})
    }
})

app.post("/excluirFornecedor", async (req, res) => {
    const {cnpj} = req.body
    if (!cnpj) return res.status(404).json({erro: "Cnpj não encotrado"})
    delet("fornecedores", `cnpj = ${cnpj}`)
    return res.status(200).json({mensagem: "Excluido com Sucesso"})
})

app.post("/comprardofornecedor", async (req, res) => {
    const  {
        cnpj,
        productId,
    quantidade_produto,
    data_compra,
    preco_unitario,
    subtotal_produto,
    valor_final,
} = req.body
    try {

        insert(
            "comprarfornecedor",
            ["cnpj",
            "productId",
            'quantidade_produto',
            'data_compra',
            'preco_unitario',
            'subtotal_produto',
            'valor_final',],
            [cnpj,
            productId,
        quantidade_produto,
        data_compra,
        preco_unitario,
        subtotal_produto,
        valor_final]
        )
        res.json({
            status: "success"
        })
    } catch (error) {
        console.error(error);
    

    }
})
app.post('/getAlerts', async (req, res) => {
    const {marketId} = req.body;
    try {
        const alerts = await select('products', 'WHERE marketId = ?', marketId);
        res.status(200).json(alerts)
        
    } catch (error) {
        console.log(error)
    }
}) 

/**
 * Middleware para redirecionar rotas não encontradas para /Error404
 * NÃO UTILIZAR METODOS POST ABAIXO!! -Kaique
 */
app.use((req, res, next) => {
    console.log(`[DEBUG] Rota não encontrada para: ${req.method} ${req.originalUrl}. Redirecionando para /Error404`);
    return res.redirect('/Error404');
});

/**
 * Tratador global de erros
 */
app.use((err, req, res, next) => {
    console.error("[DEBUG] Erro não tratado:", err.stack);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ erro: `Erro no upload: ${err.message}` });
    }
    if (err.message && err.message.startsWith("Tipo de arquivo não permitido")) {
        return res.status(400).json({ erro: err.message });
    }
    return res.status(500).json({ erro: 'Algo deu muito errado no servidor!', detalhes: err.message || 'Erro desconhecido' });
});

/**
 * Inicia servidor após carregar páginas dinâmicas
 */
(async () => {
    await loadPages();
    app.listen(port, '0.0.0.0', () => {
        const serverIp = getRealWirelessIP();
        console.log(`Servidor iniciado.`);
        console.log(`Local:   http://localhost:${port}`);
        if (serverIp !== 'localhost') {
            console.log(`Rede:    http://${serverIp}:${port}`);
        }
        console.log("[DEBUG] O servidor está escutando. As rotas de API e páginas devem estar prontas.");
    });
})();
