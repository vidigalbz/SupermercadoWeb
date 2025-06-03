const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cookieParser = require('cookie-parser');

const { select, insert, update, delet, query, selectFromRaw } = require("./database.js");

const app = express();
const port = 4000;

const { db } = require('./database.js'); // Importa o db do seu arquivo database.js

const webpages_dir = path.join(__dirname, "../webpages");
let pages = [];

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do multer
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'servidor/uploads'),
    filename: (req, file, cb) => {
        const ext = file.originalname.split(".").pop();
        cb(null, `imagem-${Date.now()}.${ext}`);
    }
});
const upload = multer({ storage: storage });

app.use('/servidor/uploads', express.static(path.resolve(__dirname, './uploads')));

const os = require('os');

function getRealWirelessIP() {
    const interfaces = os.networkInterfaces();

    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            // Filter: IPv4, not internal, and IP starts with 172.16 (your Wi-Fi network)
            if (
                iface.family === 'IPv4' &&
                !iface.internal &&
                iface.address.startsWith('172.16')
            ) {
                return iface.address;
            }
        }
    }

    return 'localhost'; // fallback
}

app.get('/api/ip', (req, res) => {
    const ip = getRealWirelessIP();
    res.json({ ip });
});

// Carregamento de páginas
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

// Endpoint para adicionar produto
app.post("/adicionarProduto", upload.single("imagem"), async (req, res) => {
    try {
        let imagempath;
        if (req.file) {
            imagempath = req.file.path;
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

        // Verifique se todos os campos necessários estão presentes
        if (!nome || !codigo || !preco || !categoria || !estoque || !lote || !departamento || !marketId || !fabricacao || !validade) {
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
            imagem: imagempath
        };

        // Inserção do produto no banco
        const result = await insert("products", [
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
            produto.imagem
        ]);

        // Registro no histórico como entrada
        await insert("history", [
            "productId",
            "marketId",
            "type",
            "beforeData",
            "afterData",
            "createdAt"
        ], [
            result.id,
            produto.marketId,
            "entrada",
            null,
            JSON.stringify({
                stock: produto.estoque,
                price: produto.preco,
                name: produto.nome
            }),
            new Date().toISOString()
        ]);

        res.status(200).json({ mensagem: "Produto adicionado com sucesso!" });

    } catch (err) {
        console.error("Erro ao adicionar produto:", err);
        res.status(500).json({ erro: "Erro ao adicionar produto." });
    }
});

// Endpoint para deletar produto pelo código
app.post('/deletarProduto', async (req, res) => {
    const { codigo } = req.body;
    if (!codigo) {
        return res.status(400).json({ erro: "Código do produto não fornecido." });
    }

    try {
        await delet("products", "productId = ?", [codigo]);
        res.status(200).json({ mensagem: "Produto deletado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao deletar produto." });
    }
});

// Get cart from cookie
app.get('/getCarrinho', (req, res) => {
    const carrinho = req.cookies.carrinho || {};
    res.json({ carrinho });
});

// Finalize purchase
app.post('/finalizarCompra', async (req, res) => {
    const { items, total, paymentMethod, marketId } = req.body;

    try {
        // Validação básica já existente...

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Nenhum item na compra' });
        }

        const parsedTotal = Number(total);
        if (isNaN(parsedTotal) || parsedTotal <= 0) {
            return res.status(400).json({ error: 'Total inválido' });
        }

        if (!['cash', 'credit', 'debit', 'pix'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Método de pagamento inválido' });
        }

        const parsedMarketId = Number(marketId);
        if (isNaN(parsedMarketId)) {
            return res.status(400).json({ error: 'ID do mercado inválido' });
        }

        for (const item of items) {
            item.productId = Number(item.productId);
            item.quantity = Number(item.quantity);
            item.unitPrice = Number(item.unitPrice);
            item.subtotal = Number(item.subtotal);

            if (isNaN(item.productId) || item.productId <= 0) {
                return res.status(400).json({ error: `ID do produto inválido (${item.productId})` });
            }
            if (isNaN(item.quantity) || item.quantity <= 0) {
                return res.status(400).json({ error: `Quantidade inválida para produto ${item.productId}` });
            }
            if (isNaN(item.unitPrice) || item.unitPrice <= 0) {
                return res.status(400).json({ error: `Preço unitário inválido para produto ${item.productId}` });
            }
            if (isNaN(item.subtotal) || item.subtotal <= 0) {
                return res.status(400).json({ error: `Subtotal inválido para produto ${item.productId}` });
            }
        }

        // VERIFICAR SE O MERCADO EXISTE
        const marketExists = await new Promise((resolve, reject) => {
            db.get(`SELECT 1 FROM markets WHERE marketId = ?`, [parsedMarketId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });

        if (!marketExists) {
            return res.status(400).json({ error: `Mercado com ID ${parsedMarketId} não existe.` });
        }

        // BEGIN TRANSACTION
        await new Promise((resolve, reject) => {
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const saleDate = new Date().toISOString();

        // 1. Inserir venda
        const saleId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO sales (marketId, total, paymentMethod, saleDate) VALUES (?, ?, ?, ?)`,
                [parsedMarketId, parsedTotal, paymentMethod, saleDate],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        if (!saleId) throw new Error('Falha ao registrar venda.');

        // 2. Processar itens
        for (const item of items) {
            console.log('Verificando produto:', item.productId, 'no mercado:', parsedMarketId);

            // SELECT stock do produto para controle de estoque
            const products = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT stock FROM products WHERE productId = ? AND marketId = ?`,
                    [item.productId, parsedMarketId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            if (products.length === 0) {
                throw new Error(`Produto ${item.productId} não encontrado no mercado ${parsedMarketId}`);
            }

            const currentStock = products[0].stock;

            if (currentStock < item.quantity) {
                throw new Error(`Estoque insuficiente para produto ${item.productId}`);
            }

            const newStock = currentStock - item.quantity;

            // LOG antes do insert em sale_items
            console.log("Inserindo item na sale_items", {
                saleId,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal
            });

            // Inserir item na sale_items
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO sale_items (saleId, productId, quantity, unitPrice, subtotal) VALUES (?, ?, ?, ?, ?)`,
                    [saleId, item.productId, item.quantity, item.unitPrice, item.subtotal],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Atualizar estoque
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE products SET stock = ? WHERE productId = ? AND marketId = ?`,
                    [newStock, item.productId, parsedMarketId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Inserir histórico
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO history (productId, marketId, type, beforeData, afterData, createdAt) VALUES (?, ?, 'saida', ?, ?, ?)`,
                    [
                        item.productId,
                        parsedMarketId,
                        JSON.stringify({ stock: currentStock }),
                        JSON.stringify({ stock: newStock }),
                        new Date().toISOString()
                    ],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // COMMIT TRANSACTION
        await new Promise((resolve, reject) => {
            db.run("COMMIT", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Limpar cookie
        res.clearCookie('carrinho');

        return res.json({
            success: true,
            saleId,
            message: 'Compra finalizada com sucesso'
        });

    } catch (error) {
        // Caso erro, tentar rollback
        try {
            await new Promise((resolve, reject) => {
                db.run("ROLLBACK", (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (rollbackError) {
            console.error('Erro no rollback:', rollbackError);
        }

        console.error('Erro ao processar /finalizarCompra:', {
            message: error.message,
            stack: error.stack,
            requestBody: req.body
        });

        return res.status(500).json({
            error: 'Erro ao processar a compra',
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});


// Endpoint para listar produtos
app.post('/estoqueData', async (req, res) => {
    const { busca, category, marketId } = req.body;
    
    if (!marketId) {
        return res.status(400).json({ erro: "marketId é obrigatório" });
    }

    try {
        let conditions = ["marketId = ?"];
        const params = [marketId];
        
        if (busca) {
            conditions.push("(name LIKE ? OR productId LIKE ? OR barcode = ?)");
            params.push(`%${busca}%`, `%${busca}%`, busca);
        }
        
        if (category) {
            conditions.push("category = ?");
            params.push(category);
        }

        const condicao = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const results = await select("products", condicao, params);
        
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
  
    // ID do mercado pode ser dinâmico no futuro
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

app.post("/editarProduto", async (req, res) => {
    try {
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
            createdAt: new Date().toISOString()
        };

        await insert("history", [
            "productId",
            "marketId",
            "type",
            "beforeData",
            "afterData",
            "createdAt"
        ], [
            historyEntry.productId,
            historyEntry.marketId,
            historyEntry.type,
            historyEntry.beforeData,
            historyEntry.afterData,
            historyEntry.createdAt
        ]);

        res.json({ success: true, message: "Produto atualizado com sucesso!" });
    } catch (err) {
        console.error("Erro ao editar produto:", err);
        res.status(500).json({ success: false, message: "Erro interno ao editar produto." });
    }
});

app.post("/cadastro", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
    }

    const existAcount = await select("users", "WHERE email = ?", [email]);

    if (existAcount.length != 0) {
        return res.status(300).json({ erro: "Já existe conta com este email" });
    }

    try {
        insert("users", ["name", "email", "password"], [name, email, password]);
        res.status(200).json({ mensagem: "Usuário cadastrado com sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar usuário" });
    }
});

app.post('/login', async (req, res) => {
    let { email, senha } = req.body;

    email = email?.toLowerCase().trim();
    senha = senha?.trim();

    try {
        const users = await select("users", "WHERE email = ?", [email]);

        console.log("Resultado do SELECT:", users);

        if (users.length === 0) {
            return res.status(401).json({ 
                status: "error", 
                message: "E-mail não cadastrado!" 
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
            email: user.email,
            userId: user.userId
        });

    } catch (err) {
        console.error("Erro no login:", err);
        res.status(500).json({ 
            status: "error", 
            message: "Erro no servidor." 
        });
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

        // Verifica se já existe no banco de dados
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

// Rota para cadastrar supermercado + gerar links
app.post("/adicionarSupermercado", async (req, res) => {
    const { nome, local, ownerId, icon } = req.body;
    var search = await select("supermarkets", `WHERE name = ?`, [nome]);
    console.log(search);
    if (search.length > 0) return res.status(400).json({ erro: "Supermercado já existente" });
   
    try {
        // 1. Gera um marketId único
        const marketId = await generateMarketId();

        // 2. Insere o supermercado
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

        // 3. Gera os links
        const baseUrl = `http://localhost:${port}`;
        const pdvLink = `${baseUrl}/pdv/${marketId}`;
        const estoqueLink = `${baseUrl}/estoque/${marketId}`;

        // 4. Retorna resposta
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
    console.log(id);
    if (!id) {
        return res.status(400).json({ erro: "ID do mercado não fornecido." });
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
        const {
            id,
            nome,
            local,
            icon,  
        } = req.body;
        const columns = ["name", "local", "icon"];

        const values = [nome, local, icon];
        const condition = `marketId = "${id}"`;

        update("supermarkets", columns, values, condition);

        res.json({ success: true, message: "Supermercado atualizado com Sucesso!" });
    }
});

// Adicionar Cookie para o Carrinho de Compras
app.post('/addCarrinho', async (req, res) => {
    const carrinho = req.body;

    if (!carrinho) {
        res.status(400).send('Dados não recebidos');
        return;
    }
    res.cookie('carrinho', carrinho, {
        maxAge: 900000,
        httpOnly: true,
    });
    res.status(200).json({ mensagem: carrinho });
});

app.post('/getMarketId', async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: "Código não fornecido" });
    }

    try {
        const result = await select('supermarkets', 'WHERE marketId = ?', [code]);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao consultar mercado" });
    }
});

app.get("/Error404", (req, res) => {
    const pathError = `${webpages_dir}/erro404/index.html`;
    res.sendFile(pathError);
});

loadPages();

app.post('/historicoData', async (req, res) => {
    console.log('Recebendo requisição de histórico:', req.body); // Log para depuração
    
    const { marketId, busca, categoria } = req.body;

    // Validação robusta
    if (!marketId) {
        console.error('Erro: marketId não fornecido');
        return res.status(400).json({ 
            success: false, 
            error: "Parâmetro 'marketId' é obrigatório" 
        });
    }

    try {
        let conditions = ["h.marketId = ?"];
        const params = [marketId];

        if (busca && busca.trim() !== '') {
            conditions.push("(p.name LIKE ? OR p.barcode = ?)");
            params.push(`%${busca.trim()}%`, busca.trim());
        }

        // Mapeamento de tipos para padronização
        const typeMap = {
            'entrada': 'entrada',
            'saida': 'saida',
            'alteracao': 'edicao'
        };
        
        if (categoria && typeMap[categoria]) {
            conditions.push("h.type = ?");
            params.push(typeMap[categoria]);
        }

        // Query mais segura com tratamento de NULL
        const sql = `
            SELECT 
                h.historyId,
                h.productId,
                h.marketId,
                h.type,
                COALESCE(h.beforeData, '{}') as beforeData,
                COALESCE(h.afterData, '{}') as afterData,
                h.createdAt as date,
                COALESCE(p.name, 'Produto Desconhecido') as name,
                p.barcode
            FROM history h
            LEFT JOIN products p ON h.productId = p.productId
            WHERE ${conditions.join(' AND ')}
            ORDER BY h.createdAt DESC
            LIMIT 500
        `;

        console.log('Executando query:', sql, params); // Log da query

        const historico = await selectFromRaw(sql, params);

        // Processamento seguro dos dados
        const processedData = historico.map(item => {
            try {
                return {
                    ...item,
                    beforeData: safeJsonParse(item.beforeData),
                    afterData: safeJsonParse(item.afterData),
                    date: item.date || new Date().toISOString()
                };
            } catch (e) {
                console.error('Erro ao processar item:', item, e);
                return null;
            }
        }).filter(item => item !== null);

        console.log('Dados processados:', processedData.length, 'itens'); // Log do resultado

        res.json({ 
            success: true, 
            data: processedData 
        });

    } catch (err) {
        console.error("Erro completo no histórico:", err.stack); // Log detalhado
        res.status(500).json({ 
            success: false, 
            error: "Erro interno ao processar histórico",
            details: err.message
        });
    }
});

// Função auxiliar para parse seguro
function safeJsonParse(str) {
    try {
        return str ? JSON.parse(str) : {};
    } catch (e) {
        console.error('Erro ao parsear JSON:', str, e);
        return {};
    }
}

app.post('/verific', async (req, res) => {
  try {
    const { marketId } = req.body;

    // Validação: campo ausente ou inválido
    if (!marketId || typeof marketId !== "string" || marketId.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "marketId não fornecido ou inválido." 
      });
    }

    const result = await select('supermarkets', 'WHERE marketId = ?', [marketId]);

    if (!result || result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Supermercado não encontrado." 
      });
    }

    res.status(200).json({ success: true, market: result[0] });

  } catch (err) {
    console.error("Erro ao verificar supermercado:", err);
    res.status(500).json({ 
      success: false, 
      message: "Erro interno ao verificar supermercado." 
    });
  }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor iniciado na porta http://localhost:${port}`);
});