const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cookieParser = require('cookie-parser');

const { select, insert, update, delet, query} = require("./database.js");

const app = express();
const port = 4000;

const { db } = require('./database.js'); // Importa o db do seu arquivo database.js

const webpages_dir = path.join(__dirname, "../webpages");
var pages = [];

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do multer (mas sem salvar arquivos por enquanto)
const storage = multer.diskStorage({
    destination: ('servidor/uploads'),
    filename: (req, file, cb) => {
        const ext = file.originalname.split(".").pop()
        cb(null, `imagem-${Date.now()}.${ext}`)
    }
    
})
const upload = multer({storage: storage});

app.use('/servidor/uploads', express.static(path.resolve(__dirname, './uploads')));  

const os = require('os');
const { table } = require("console");

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

// Endpoint para adicionar produto (imagem é ignorada)
app.post("/adicionarProduto", upload.single("imagem"), async (req, res) => {
    try {
        let imagempath;
        if (req.file){
            let imagem = req.file;
            imagempath = imagem.path
        }
        else{
            const {imagem} = req.body
            imagempath = imagem
        }

        console.log(imagempath)
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

        console.log([
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

        insert("products", [
            "marketId", "name", "price", "category","departament",
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

        res.status(200).json({ mensagem: "Produto adicionado com sucesso!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao adicionar produto." });
    }
});


// Endpoint para deletar produto pelo código
app.post('/deletarProduto', async (req, res) => {
    const { codigo } = req.body;
    console.log(codigo)
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

// Get cart from cookie
app.get('/getCarrinho', (req, res) => {
    const carrinho = req.cookies.carrinho || {};
    res.json({ carrinho });
});

// Finalize purchase
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
            // Validate item structure
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
            
            // Update product stock
            const product = await select('products', 'WHERE productId = ?', [item.productId]);
            if (product.length > 0) {
                const currentStock = product[0].stock;
                if (currentStock > 0){
                    const newStock = currentStock - item.quantity;
                    await update('products', ['stock'], [newStock], `productId = ${item.productId}`);
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

// Endpoint para listar produtos
app.post('/estoqueData', async (req, res) => {
    const { busca, category, marketId } = req.body;
    
    if (!marketId) {
        return res.status(400).json({ erro: "marketId é obrigatório" });
    }

    // Escapa valores para segurança
    const marketIdSafe = marketId.replace(/'/g, "''");
    let buscaSafe = busca ? busca.replace(/'/g, "''") : null;
    let categorySafe = category ? category.replace(/'/g, "''") : null;

    // Começa com a condição obrigatória do marketId
    let conditions = [`marketId = '${marketIdSafe}'`];
    
    // Adiciona condições de busca se existirem
    if (buscaSafe) {
        conditions.push(`(name LIKE '%${buscaSafe}%' OR productId LIKE '%${buscaSafe}%' OR barcode = '${buscaSafe}')`);
    }
    
    // Adiciona condição de categoria se existir
    if (categorySafe) {
        conditions.push(`category = '${categorySafe}'`);
    }

    // Junta todas as condições com AND
    const condicao = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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

app.post("/cadastro", async (req, res) => {
    const {name, password, gestor} = req.body;

    if (!name || !password) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
    }

    const existAcount = await select("users", "WHERE name = ?", name)

    if (existAcount.length != 0 ) {
        return res.status(300).json({erro: "Usuário já existente!"})
    }

    try {
        insert("users", ["name", "password", "gestor"], [name, password, gestor]);
        res.status(200).json({ mensagem: "Usuario cadastrado com sucesso"});
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar usuario"})
    }
});

app.post('/login', async (req, res) => {
    let { name, senha } = req.body;

    try {
        const users = await select("users", "WHERE name = ?", [name]);

        console.log(" Resultado do SELECT:", users);

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
            id: user.userId ,
            name: user.name,
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
    var search = await select("supermarkets", `Where name = ?`, [nome])
    console.log(search)
    if (search.length > 0) return res.status(400).json({erro : "Supermercado já existente"});
   
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
    console.log(id)
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
    const {busca} = req.body;
    let condicao = "";
    if (busca) {
        const termo = busca.replace(/'/g, "''")
        condicao = `WHERE ownerId = ${termo}` 
    }

    try{
    const results = await select("supermarkets", condicao);
    res.status(200).json({mensagem: results});
    } catch (err) {
        console.error(err);
        res.status(500).json({erro: "Erro ao consultar supermercados."})
    }
});

app.post('/updateSupermercado', async (req, res) => {
    if (req.body){
        const {
            id,
            nome,
            local,
            icon,  
        } = req.body 
        const columns = ["name", "local", "icon"]

        const values = [nome, local, icon]
        const condition = `marketId = "${id}"`

        update("supermarkets", columns, values, condition)

        res.json({ success: true, message: "Supermercado atualizado com Sucesso!" });
    }
    
})


//Adicionar Cookie para o Carrinho de Compras
app.post('/addCarrinho', async (req, res) => {
    const carrinho = req.body;

    if (!carrinho){
        res.status(400).send('Dados não recebidos')
    }
    res.cookie('carrinho', carrinho, {
        maxAge : 900000,
        httpOnly: true,
    });
    res.status(200).json({mensagem : carrinho})
})

app.post('/getMarketId', async (req, res) => {
    const code = req.body;
    console.log(code)
    query(`SELECT marketd FROM superMarkets WHERE marketid == '${code}'`)
})


app.post("/verific", async (req, res) => { //Verficação se existe o SuperMercado
    const {busca, column, tableSelect} = req.body
    let condicao = "";
    if (busca && column) {
        const termo = busca.replace(/'/g, "''")
        condicao = `WHERE ${column.replace(/'/g, "''")} = ${termo}` 
    }
    try{
    const results = await select(tableSelect, condicao);
    res.status(200).json({mensagem: results});
    }
    catch(e){
        console.log(e)
    }
})



app.get("/Error404", (req, res) => {
    const pathError =  `${webpages_dir}/erro404/index.html`
    res.sendFile(pathError)
})

loadPages();

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor iniciado na porta http://localhost:${port}`);
});