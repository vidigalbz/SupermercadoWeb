const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cookieParser = require('cookie-parser');
const os = require('os');

const { db, select, insert, update, delet, query, selectFromRaw } = require("./database.js");

const app = express();
const port = process.env.PORT || 4000;

const webpages_dir = path.join(__dirname, "../webpages");
console.log(`[DEBUG] Diretório de páginas web configurado para: ${webpages_dir}`);

let pages = []; // Array para armazenar nomes de diretórios de páginas

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(webpages_dir));

const uploadsDir = path.join(__dirname, 'servidor/uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/servidor/uploads', express.static(uploadsDir)); // Servir uploads

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


function getRealWirelessIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (iface.address.startsWith('192.168.') || iface.address.startsWith('172.16.') || iface.address.startsWith('10.')) {
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

app.get('/relatorio/:id', (req, res) => {
  const marketId = req.params.id;
  res.render('relatorio', { marketId });
});

app.post('/api/relatorio-data', async (req, res) => {
    try {
        const { marketId, filtro = 'saida', tipoRelatorio } = req.body;
        
        // 1. Verificar mercado
        const mercado = await select('supermarkets', 'WHERE marketId = ?', [marketId]);
        if (!mercado || mercado.length === 0) {
            return res.status(404).json({ error: 'Mercado não encontrado' });
        }

        // 2. Obter datas para filtro
        const hoje = new Date().toISOString().split('T')[0];
        const umMesAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 3. Consulta para produtos com histórico do tipo 'saida'
        const produtosComSaida = await selectFromRaw(`
            SELECT 
                p.productId,
                p.name as nome,
                p.barcode as codigo,
                COUNT(h.historyId) as quantidade,
                SUM(CASE WHEN h.type = 'saida' THEN JSON_EXTRACT(h.afterData, '$.stock') - JSON_EXTRACT(h.beforeData, '$.stock') ELSE 0 END) as quantidade_saida,
                SUM(CASE WHEN h.type = 'saida' THEN (JSON_EXTRACT(h.beforeData, '$.stock') - JSON_EXTRACT(h.afterData, '$.stock')) * p.price ELSE 0 END) as valorTotal
            FROM history h
            JOIN products p ON h.productId = p.productId AND h.marketId = p.marketId
            WHERE h.marketId = ? AND h.type = ?
            AND date(h.createdAt) BETWEEN date(?) AND date(?)
            GROUP BY p.productId
            ORDER BY valorTotal DESC
        `, [marketId, filtro, umMesAtras, hoje]);

        const produtosComSaidaIds = produtosComSaida.map(p => p.productId);

        // 4. Consultas adicionais filtradas por produtos com saída
        const vendasHoje = await selectFromRaw(`
            SELECT SUM(total) as total FROM sales 
            WHERE marketId = ? AND date(saleDate) = date(?)
            AND saleId IN (
                SELECT DISTINCT si.saleId 
                FROM sale_items si
                WHERE si.productId IN (${produtosComSaidaIds.join(',') || 'NULL'})
            )
        `, [marketId, hoje]);

        // 5. Consulta para mais vendidos (apenas produtos com histórico de saída)
        const maisVendidos = await selectFromRaw(`
            SELECT 
                p.name as nome,
                SUM(si.quantity) as qtd,
                SUM(si.subtotal) as precoTotal
            FROM sale_items si
            JOIN products p ON si.productId = p.productId
            JOIN sales s ON si.saleId = s.saleId
            WHERE s.marketId = ? 
            AND date(s.saleDate) BETWEEN date(?) AND date(?)
            AND p.productId IN (${idsProdutosVendidos})
            GROUP BY p.productId
            ORDER BY qtd DESC
            LIMIT 10
        `, [marketId, umMesAtras, hoje]);

        // 6. Consulta para curva ABC (apenas categorias com produtos vendidos)
        const curvaABC = await selectFromRaw(`
            SELECT 
                p.category as categoria,
                SUM(si.subtotal) as valor
            FROM sale_items si
            JOIN products p ON si.productId = p.productId
            JOIN sales s ON si.saleId = s.saleId
            WHERE s.marketId = ? 
            AND date(s.saleDate) BETWEEN date(?) AND date(?)
            AND p.productId IN (${idsProdutosVendidos})
            GROUP BY p.category
            ORDER BY valor DESC
            LIMIT 5
        `, [marketId, umMesAtras, hoje]);

        // 7. Produtos encalhados (que não têm histórico de saída recente)
        const produtosEncalhados = await selectFromRaw(`
            SELECT 
                p.name as nome,
                p.stock as estoque,
                p.barcode as codigo,
                p.lot as lote,
                p.expirationDate as validade,
                MAX(s.saleDate) as ultimaVenda
            FROM products p
            LEFT JOIN sale_items si ON p.productId = si.productId
            LEFT JOIN sales s ON si.saleId = s.saleId AND s.marketId = p.marketId
            WHERE p.marketId = ? 
            AND p.productId NOT IN (
                SELECT DISTINCT h.productId
                FROM history h
                WHERE h.marketId = ? AND h.type = 'saida'
                AND date(h.createdAt) >= date(?)
            )
            GROUP BY p.productId
            HAVING p.stock > 0
            ORDER BY ultimaVenda ASC
            LIMIT 10
        `, [marketId, marketId, umMesAtras]);

        // Calcular variações percentuais (simplificado)
        const calcularVariacao = (atual, anterior) => {
            if (!anterior || anterior === 0) return 100;
            return ((atual - anterior) / anterior * 100).toFixed(2);
        };

        // Montar resposta
        const response = {
            produtosComSaida,
            produtosComSaidaIds,
            vendasHoje: {
                total: vendasHoje[0]?.total?.toFixed(2) || "0,00",
                variacao: calcularVariacao(vendasHoje[0]?.total || 0, vendasHoje[1]?.total || 0)
            },
            // ... (restante da resposta)
        };

        res.json(response);

    } catch (error) {
        console.error('Erro ao gerar dados de relatório:', error);
        res.status(500).json({ error: 'Erro interno ao gerar relatório' });
    }   
});

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
                    pages.push(arquivo); // Adiciona o nome da pasta (ex: "login", "main")
                }
            } catch (statErr) {
                console.error(`[DEBUG] Erro ao ler stats de ${caminhoCompleto}:`, statErr.message);
            }
        }

        console.log("[DEBUG] Pastas de páginas candidatas identificadas:", pages);

        pages.forEach(pageName => { // pageName é o nome da pasta, ex: "login"
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
        // Este log agora mostra os nomes das pastas que foram consideradas.
        // O log acima dentro do loop indica se a rota foi realmente criada.
    } catch (err) {
        console.error("[DEBUG] Erro CRÍTICO ao carregar páginas dinâmicas:", err);
    }
}

// --- ROTAS DA API COMEÇAM AQUI ---
// (Mantenha todas as suas rotas de API como /adicionarProduto, /login (API), etc.)

app.post("/adicionarProduto", upload.single("imagem"), async (req, res) => {
    try {
        let imagemPathToStore;
        if (req.file) {
            imagemPathToStore = `servidor/uploads/${req.file.filename}`;
            imagemPathToStore = imagemPathToStore.replace(/\\/g, "/");
        } else {
            const { imagem: imagemUrl } = req.body;
            if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '') {
                 imagemPathToStore = imagemUrl;
            } else {
                 imagemPathToStore = null;
            }
        }

        const {
            nome, codigo, preco, categoria, estoque, lote,
            departamento, marketId, fabricacao, validade, userId
        } = req.body;

        if (!nome || !codigo || !preco || !categoria || !estoque || !lote || !departamento || !marketId || !fabricacao || !validade || !userId) {
            return res.status(400).json({ erro: "Campos obrigatórios estão ausentes." });
        }

        const produto = {
            marketId, nome, codigo, preco: parseFloat(preco), categoria, departamento,
            estoque: parseInt(estoque), lote, fabricacao, validade,
            imagem: imagemPathToStore, userId: parseInt(userId)
        };

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

        await insert("history", [
            "productId", "marketId", "userId", "type",
            "beforeData", "afterData", "createdAt"
        ], [
            newProductId, produto.marketId, produto.userId, "entrada",
            null,
            JSON.stringify({ stock: produto.estoque, price: produto.preco, name: produto.nome }),
            new Date().toISOString()
        ]);
        res.status(201).json({ mensagem: "Produto adicionado com sucesso!", productId: newProductId });
    } catch (err) {
        console.error("Erro ao adicionar produto:", err);
        if (err.message.startsWith("Tipo de arquivo não permitido")) {
             return res.status(400).json({ erro: err.message });
        }
        res.status(500).json({ erro: "Erro interno ao adicionar produto.", detalhes: err.message });
    }
});

app.post('/deletarProduto', async (req, res) => {
    const { productId, userId, marketId } = req.body;

    if (!productId || !userId || !marketId) {
        return res.status(400).json({ erro: "Parâmetros obrigatórios ausentes (productId, userId, marketId)." });
    }

    const productIdInt = parseInt(productId);
    const userIdInt = parseInt(userId);

    if (isNaN(productIdInt) || isNaN(userIdInt)) {
        return res.status(400).json({ erro: "productId e userId devem ser números válidos." });
    }

    try {

        const produtos = await select("products", "WHERE productId = ? AND marketId = ?", [productIdInt, marketId]);

        if (!produtos || produtos.length === 0) {
            return res.status(404).json({ erro: "Produto não encontrado neste mercado ou ID inválido." });
        }
        const produtoDeletado = produtos[0];
        
        await insert("history", [
            "productId", "marketId", "userId", "type",
            "beforeData", "afterData", "createdAt"
        ], [
            produtoDeletado.productId,
            produtoDeletado.marketId,
            userIdInt,
            "remocao",
            JSON.stringify(produtoDeletado),
            null,
            new Date().toISOString()
        ]);

        const deleteResult = await delet("products", "productId = ? AND marketId = ?", [productIdInt, marketId]);

        if (deleteResult.changes > 0) {
            res.status(200).json({ mensagem: "Produto deletado com sucesso e histórico de remoção registrado!" });
        } else {

            console.warn(`/deletarProduto: Produto ${productIdInt} encontrado mas 0 linhas afetadas na deleção.`);
            res.status(404).json({ erro: "Produto encontrado, mas não pôde ser deletado. Tente novamente." });
        }

    } catch (err) {
        console.error("BACKEND: Erro ao deletar produto:", err);
        res.status(500).json({ erro: "Erro interno no servidor ao tentar deletar o produto.", detalhes: err.message });
    }
});

app.get('/getCarrinho', (req, res) => {
    const carrinho = req.cookies.carrinho || {};
    res.json({ carrinho });
});

app.post('/finalizarCompra', async (req, res) => {
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
        if (isNaN(parseInt(item.productId)) || parseInt(item.productId) <= 0 ||
            isNaN(parseInt(item.quantity)) || parseInt(item.quantity) <= 0 ||
            isNaN(parseFloat(item.unitPrice)) || parseFloat(item.unitPrice) < 0 ||
            isNaN(parseFloat(item.subtotal)) || parseFloat(item.subtotal) < 0) {
            return res.status(400).json({ error: `Item inválido na compra: ${JSON.stringify(item)}` });
        }
    }

    try {
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
        res.status(201).json({ success: true, saleId, message: 'Compra finalizada com sucesso' });
    } catch (error) {
        await query("ROLLBACK").catch(rbError => console.error('Erro no rollback:', rbError));
        console.error('Erro ao processar /finalizarCompra:', error);
        res.status(500).json({ error: 'Erro ao processar a compra', message: error.message });
    }
});

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
        res.status(200).json({ mensagem: results });
    } catch (err) {
        console.error("Erro ao consultar estoque:", err);
        res.status(500).json({ erro: "Erro ao consultar estoque.", detalhes: err.message });
    }
});

app.post('/getSetor', async (req, res) => {
    try {
        const { marketId } = req.body;
        if (!marketId) {
            return res.status(400).json({ success: false, error: "marketId é obrigatório" });
        }
        const cats = await select("setors", "WHERE type = 'cat' AND marketId = ?", [marketId]);
        const depts = await select("setors", "WHERE type = 'dept' AND marketId = ?", [marketId]);
        res.status(200).json({
            success: true,
            cat: cats.map(item => item.name),
            dept: depts.map(item => item.name)
        });
    } catch (err) {
        console.error("Erro ao consultar setores:", err);
        res.status(500).json({ success: false, error: "Erro interno ao consultar setores.", detalhes: err.message });
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
        res.status(201).json({ success: true, message: "Setor adicionado com sucesso!" });
    } catch (err) {
        console.error("Erro ao salvar setor:", err);
        if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({ success: false, error: "Este setor já existe neste mercado." });
        }
        res.status(500).json({ success: false, error: "Erro interno ao salvar setor", detalhes: err.message });
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
            res.status(200).json({ mensagem: "Setor excluído com sucesso!" });
        } else {
            res.status(404).json({ erro: "Setor não encontrado ou já excluído." });
        }
    } catch (err) {
        console.error("Erro ao excluir setor:", err);
        res.status(500).json({ erro: "Erro interno ao excluir setor.", detalhes: err.message });
    }
});

app.post("/editarProduto", async (req, res) => {
    try {
        const {
            productId, name, price, category, departament, stock,
            lot, expirationDate, manufactureDate, barcode, marketId, userId
        } = req.body;
        if (!productId || !name || price == null || !category || !departament || stock == null || !lot || !expirationDate || !manufactureDate || !barcode || !marketId || !userId) {
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
            name, price: parseFloat(price), category, departament, stock: parseInt(stock),
            lot, expirationDate, manufactureDate, barcode, marketId
        };
        await insert("history", [
            "productId", "marketId", "userId", "type",
            "beforeData", "afterData", "createdAt"
        ], [
            productId, marketId, parseInt(userId), "edicao",
            JSON.stringify(beforeData), JSON.stringify(afterData),
            new Date().toISOString()
        ]);
        res.json({ success: true, message: "Produto atualizado com sucesso!" });
    } catch (err) {
        console.error("Erro ao editar produto:", err);
        res.status(500).json({ success: false, message: "Erro interno ao editar produto.", detalhes: err.message });
    }
});

app.post("/cadastro", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ erro: "Todos os campos (nome, email, senha) são obrigatórios." });
    }
    try {
        const existingAccounts = await select("users", "WHERE email = ?", [email.toLowerCase().trim()]);
        if (existingAccounts.length !== 0) {
            return res.status(409).json({ erro: "Já existe uma conta com este email." });
        }
        await insert("users", ["name", "email", "password"], [name.trim(), email.toLowerCase().trim(), password]);
        res.status(201).json({ mensagem: "Usuário cadastrado com sucesso." });
    } catch (err) {
        console.error("Erro ao cadastrar usuário:", err);
        res.status(500).json({ erro: "Erro interno ao cadastrar usuário.", detalhes: err.message });
    }
});

// ESTA É A ROTA DE API PARA FAZER O LOGIN (POST)
// NÃO É A ROTA PARA SERVIR A PÁGINA HTML DE LOGIN (GET)
app.post('/login', async (req, res) => {
    let { email, senha: plainPasswordFromUser } = req.body;
    if (!email || !plainPasswordFromUser) {
        return res.status(400).json({ status: "error", message: "Email e senha são obrigatórios." });
    }
    email = email.toLowerCase().trim();
    try {
        const users = await select("users", "WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(401).json({ status: "error", message: "E-mail não cadastrado ou senha incorreta." });
        }
        const user = users[0];
        if (plainPasswordFromUser !== user.password) {
            return res.status(401).json({ status: "error", message: "E-mail não cadastrado ou senha incorreta." });
        }
        res.status(200).json({
            status: "success",
            message: "Login bem-sucedido!",
            name: user.name,
            email: user.email,
            userId: user.userId
        });
    } catch (err) {
        console.error("Erro no login (API):", err);
        res.status(500).json({ status: "error", message: "Erro interno no servidor durante o login.", detalhes: err.message });
    }
});

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
        // Verifica se ESTE usuário já possui um supermercado com este nome
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

        // Monta os links de forma mais dinâmica
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `<span class="math-inline">\{protocol\}\://</span>{host}`;

        const pdvLink = `<span class="math-inline">\{baseUrl\}/pdv/?id\=</span>{marketId}`;
        const estoqueLink = `<span class="math-inline">\{baseUrl\}/estoque/?id\=</span>{marketId}`;

        res.status(201).json({
            success: true,
            message: "Supermercado adicionado com sucesso!",
            data: {
                marketId,
                name: nome.trim(),
                local: local.trim(),
                icon,
                ownerId,
                pdvLink,
                estoqueLink,
            }
        });

    } catch (err) {
        console.error("[ADDSUPER] Erro ao adicionar supermercado:", err);
        res.status(500).json({
            success: false,
            error: "Erro interno ao adicionar supermercado.",
            details: err.message
        });
    }
});

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
        res.status(200).json({ success: true, data: supermarkets });
    } catch (err) {
        console.error("HISTORICO - Erro ao listar supermercados (backend):", err);
        res.status(500).json({ success: false, error: "Erro interno ao listar supermercados." });
    }
});

app.post('/deletarSupermercado', async (req, res) => {
    const { marketId, ownerId } = req.body;
    if (!marketId || !ownerId) {
        return res.status(400).json({ erro: "marketId e ownerId do proprietário são obrigatórios." });
    }
    try {
        const result = await delet("supermarkets", "marketId = ? AND ownerId = ?", [marketId, parseInt(ownerId)]);
        if (result.changes > 0) {
            res.status(200).json({ mensagem: "Supermercado deletado com sucesso!" });
        } else {
            res.status(404).json({ erro: "Supermercado não encontrado ou você não tem permissão para deletá-lo." });
        }
    } catch (err) {
        console.error("Erro ao deletar supermercado:", err);
        res.status(500).json({ erro: "Erro interno ao deletar supermercado.", detalhes: err.message });
    }
});

app.post('/supermercadoData', async (req, res) => {
    const { busca } = req.body;

    if (!busca) {

        console.log("Tentativa de buscar supermercados sem um ownerId (busca).");
        return res.status(400).json({ erro: "ID do proprietário (busca) é obrigatório.", mensagem: [] });
    }

    const ownerId = parseInt(busca); // Converte para inteiro

    if (isNaN(ownerId)) {
        console.log(`ownerId inválido recebido: ${busca}`);
        return res.status(400).json({ erro: "ID do proprietário fornecido é inválido.", mensagem: [] });
    }

    try {
        // Usa consulta parametrizada para segurança e correção de tipo
        const results = await select("supermarkets", "WHERE ownerId = ?", [ownerId]);
        res.status(200).json({ mensagem: results });
    } catch (err) {
        console.error("Erro ao consultar supermercados:", err);
        res.status(500).json({ erro: "Erro ao consultar supermercados." });
    }
});

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
            res.json({ success: true, message: "Supermercado atualizado com sucesso!" });
        } else {
            res.status(404).json({ success: false, message: "Supermercado não encontrado ou você não tem permissão para atualizá-lo." });
        }
    } catch (err) {
        console.error("Erro ao atualizar supermercado:", err);
        res.status(500).json({ success: false, message: "Erro interno ao atualizar supermercado.", detalhes: err.message });
    }
});

app.post('/addCarrinho', async (req, res) => {
    const carrinhoData = req.body.carrinho;
    if (!carrinhoData) {
        return res.status(400).send('Dados do carrinho não recebidos corretamente.');
    }
    res.cookie('carrinho', carrinhoData, {
        maxAge: 24 * 60 * 60 * 1000, httpOnly: true,
    });
    res.status(200).json({ mensagem: "Carrinho atualizado nos cookies.", data: carrinhoData });
});

app.post('/getMarketId', async (req, res) => {
    const { code: marketId } = req.body;
    if (!marketId) {
        return res.status(400).json({ error: "Código (marketId) não fornecido" });
    }
    try {
        const result = await select('supermarkets', 'WHERE marketId = ?', [marketId]);
        if (result.length > 0) {
            res.status(200).json({ success: true, market: result[0] });
        } else {
            res.status(404).json({ success: false, error: "Mercado não encontrado" });
        }
    } catch (err) {
        console.error("Erro ao consultar mercado por marketId:", err);
        res.status(500).json({ success: false, error: "Erro interno ao consultar mercado", detalhes: err.message });
    }
});

app.get("/Error404", (req, res) => {
    const pathError = path.join(webpages_dir, "erro404", "index.html");
    if (fs.existsSync(pathError)) {
        res.status(404).sendFile(pathError);
    } else {
        console.log(`[DEBUG] Arquivo de erro404 não encontrado em: ${pathError}`);
        res.status(404).send("<h1>404 - Página não encontrada</h1><p>E a página de erro customizada também não foi encontrada.</p>");
    }
});

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
        res.json({ success: true, data: processed });
    } catch (err) {
        console.error("Erro no /historicoData:", err);
        res.status(500).json({ success: false, error: "Erro interno ao processar histórico", detalhes: err.message });
    }
});

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
    res.status(200).json({ success: true, market: result[0] });
  } catch (err) {
    console.error("Erro ao verificar supermercado:", err);
    res.status(500).json({ success: false, message: "Erro interno ao verificar supermercado.", detalhes: err.message });
  }
});

app.post('/api/getUserDetails', async (req, res) => {
    const { userId } = req.body; // Espera receber o userId
    if (!userId) {
        return res.status(400).json({ success: false, error: "O userId é obrigatório." });
    }
    try {
        const users = await select("users", "WHERE userId = ?", [parseInt(userId)]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: "Usuário não encontrado." });
        }
        // Retorna apenas os dados necessários e não sensíveis do usuário
        const { name, email } = users[0];
        // Retorna a 'mensagem' como um array contendo um objeto,
        // para alinhar com a expectativa original do script do frontend que acessava data.mensagem[0]
        res.status(200).json({ success: true, mensagem: [{ name, email }] });
    } catch (err) {
        console.error("Erro ao buscar detalhes do usuário:", err);
        res.status(500).json({ success: false, error: "Erro interno ao buscar detalhes do usuário." });
    }
});
app.post('/getRelatoriaSaida', async (req, res)=> {
    const { marketId } = req.body;

    const leavingProducts = await select("history", "WHERE marketId = ? and type = 'saida' ", marketId)
    for (var productId in leavingProducts) {
        const product = await select("products", 'WHERE productId = ?' productId.productId)
    }
})

app.use((req, res, next) => {
    console.log(`[DEBUG] Rota não encontrada para: ${req.method} ${req.originalUrl}. Redirecionando para /Error404`);
    res.redirect('/Error404');
});

// Global error handler (deve ser o último middleware)
app.use((err, req, res, next) => {
    console.error("[DEBUG] Erro não tratado:", err.stack);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ erro: `Erro no upload: ${err.message}` });
    }
    if (err.message && err.message.startsWith("Tipo de arquivo não permitido")) { // Verifica se err.message existe
        return res.status(400).json({ erro: err.message });
    }
    res.status(500).json({ erro: 'Algo deu muito errado no servidor!', detalhes: err.message || 'Erro desconhecido' });
});

(async () => {
    await loadPages(); // Garante que as rotas das páginas HTML são carregadas primeiro
    app.listen(port, '0.0.0.0', () => {
        const serverIp = getRealWirelessIP();
        console.log(`Servidor iniciado.`);
        console.log(`Local:   http://localhost:${port}`);
        if (serverIp !== 'localhost') {
            console.log(`Rede:    http://${serverIp}:${port}`);
        }
        console.log("[DEBUG] O servidor está escutando. As rotas de API e páginas devem estar prontas.");
        console.log("[DEBUG] Se você tem uma pasta chamada 'login' com 'index.html' dentro de 'webpages', a rota '/login' deve ter sido criada.");
    });
})();