const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { select, insert, update, delet } = require("./database.js");

const app = express();
const port = 4000;

const webpages_dir = path.join(__dirname, "../webpages");
var pages = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do multer (mas sem salvar arquivos por enquanto)
const storage = multer.memoryStorage(); // Armazena em memória (pode ser ignorado)
const upload = multer({ storage });

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
            validade
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
            validade
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
            produto.codigo
        ])
        insert("products", [
            "marketId", "name", "price", "category",
            "stock", "lot", "expirationDate", "manufactureDate",
            "barcode"
        ], [
            produto.marketId,
            produto.nome,
            produto.preco,
            produto.categoria,
            produto.estoque,
            produto.lote,
            produto.validade,
            produto.fabricacao,
            produto.codigo
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


loadPages();

app.listen(port, () => {
    console.log(`Servidor iniciado na porta http://localhost:${port}`);
});
