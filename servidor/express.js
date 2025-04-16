const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { select, insert, update, delet, query, insertLink} = require("./database.js");

const app = express();
const port = 4000;

const { db } = require('./database.js'); // Importa o db do seu arquivo database.js

const webpages_dir = path.join(__dirname, "../webpages");
var pages = [];

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


// Endpoint para listar produtos
app.post('/estoqueData', async (req, res) => {
    const { busca } = req.body;
    console.log(busca)
    let condicao = "";
    if (busca) {
        const termo = busca.replace(/'/g, "''"); // Escapa aspas simples para segurança
        condicao = `WHERE name LIKE '%${termo}%' OR productId LIKE '%${termo}%'`;
    }

    try {
        const results = await select("products", condicao);
        res.status(200).json({ mensagem: results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao consultar estoque." });
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

// Rota para cadastrar supermercado + gerar links
app.post("/adicionarSupermercado", async (req, res) => {
    const { nome, local, ownerId, icon } = req.body;

    try {
        // 1. Insere o supermercado (usando sua função original)
        insert("supermarkets", 
            ["name", "local", "ownerId", "icon", "createdAt"],
            [nome, local, ownerId, icon, new Date().toISOString()]
        );

        // 2. Obtém o ID do último registro inserido
        const market = await new Promise((resolve, reject) => {
            db.get(
                "SELECT marketId FROM supermarkets ORDER BY marketId DESC LIMIT 1",
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!market) throw new Error("Falha ao obter ID do supermercado");
        const marketId = market.marketId;

        // 3. Gera e armazena os links
        const baseUrl = `http://localhost:${port}`;
        const pdvLink = `${baseUrl}/pdv/${marketId}`;
        const estoqueLink = `${baseUrl}/estoque/${marketId}`;

        await insertLink(pdvLink, marketId, "pdv");
        await insertLink(estoqueLink, marketId, "estoque");

        // 4. Retorna a resposta
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
    const { name } = req.body;
    console.log(codigo)
    if (!codigo) {
        return res.status(400).json({ erro: "Nome do mercado não fornecido." });
    }

    try {
        delet("supermarkets", `name = '${name}'`);
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
})

loadPages();

app.listen(port, () => {
    console.log(`Servidor iniciado na porta http://localhost:${port}`);
});