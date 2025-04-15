const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cookieParser = require('cookie-parser');

const { select, insert, update, delet, query} = require("./database.js");

const app = express();
const port = 4000;

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
        const imagem = req.file
        if (!imagem) {
            return res.status(400).json({error: 'Nenhuma imagem enviada'})
        }
        else{
            console.log(imagem.path)
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
            imagem: imagem.path
        };
        console.log([
            produto.marketId,
            produto.nome,
            produto.preco,
            produto.categoria,
            produto.estoque,
            produto.lote,
            produto.validade,
            produto.fabricacao,
            produto.codigo,
            produto.imagem
        ])
        insert("products", [
            "marketId", "name", "price", "category",
            "stock", "lot", "expirationDate", "manufactureDate",
            "barcode", "image"
        ], [
            produto.marketId,
            produto.nome,
            produto.preco,
            produto.categoria,
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
                const newStock = currentStock - item.quantity;
                await update('products', ['stock'], [newStock], `productId = ${item.productId}`);
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
    var { busca } = req.body;
    var category = req.body.category
    let condicao = "";
    if (busca && !category) {
        const buscaText = busca.replace(/'/g, "''"); // Escapa aspas simples para segurança
        condicao = `WHERE name LIKE '%${termo}%' OR productId LIKE '%${termo}%'  OR barcode = '${termo}'`;
    }
    else if (busca && category){
        const buscaText = busca.replace(/'/g, "''"); // Escapa aspas simples para segurança
        const categoryText = category.replace(/'/g, "''"); // Escapa aspas simples para segurança
        condicao  = `WHERE name LIKE '%${termo}%' OR productId LIKE '%${termo}%'  OR barcode = '${termo}' AND category = '${categoryText}'`
    }
    else if(category){
        const categoryText = category.replace(/'/g, "''"); // Escapa aspas simples para segurança
        condicao = `WHERE category = '${categoryText}'`
    }
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
    const {name, email, password} = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
    }

    try {
        insert("users", ["name", "email", "password"], [name, email, password]);
        res.status(200).json({ mensagem: "Usuario cadastrado com sucesso"});
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar usuario"})
    }
});

app.post('/login', async (req, res) => {
    let { email, senha } = req.body;



    email = email?.toLowerCase().trim();
    senha = senha?.trim();

    try {
        const users = await select("users", "WHERE email = ?", [email]);

        console.log(" Resultado do SELECT:", users);

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
            name: user.name,
            email: user.email
        });

    } catch (err) {
        console.error("Erro no login:", err);
        res.status(500).json({ 
            status: "error", 
            message: "Erro no servidor." 
        });
    }
});

app.post("/adicionarSupermercado", async (req, res) => {
    const {nome, local, onwerId, icon} = req.body

    insert("supermarkets", ["name", "local", "ownerId", "icon"], [nome, local, onwerId, icon])
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

loadPages();

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor iniciado na porta http://localhost:${port}`);
});

