// /servidor/controllers/produtosController.js

// Importa as funções do banco de dados
const { insert, select, update, delet } = require('../database.js');

// Função para ADICIONAR produto
const adicionarProduto = async (req, res) => {
    try {
        let imagemPathToStore = null;
        if (req.file) {
            // Caminho relativo para salvar no banco de dados
            imagemPathToStore = `servidor/uploads/${req.file.filename}`.replace(/\\/g, "/"); //
        } else {
            const { imagem: imagemUrl } = req.body; //
            if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '') {
                imagemPathToStore = imagemUrl; //
            }
        }

        const {
            nome, codigo, preco, categoria, estoque, lote,
            departamento, marketId, fabricacao, validade, userId, fornecedor
        } = req.body; //

        if (
            !nome || !codigo || !preco || !categoria || !estoque ||
            !lote || !departamento || !marketId || !fabricacao || !validade || !userId || !fornecedor
        ) {
            return res.status(400).json({ erro: "Campos obrigatórios estão ausentes." }); //
        }

        const produto = {
            marketId, nome, codigo, preco: parseFloat(preco), categoria, departamento, //
            estoque: parseInt(estoque), lote, fabricacao, validade, imagem: imagemPathToStore, userId: parseInt(userId), fornecedor//
        };

        const result = await insert("products",
            ["marketId", "name", "price", "category", "departament", "stock", "lot", "expirationDate", "manufactureDate", "barcode", "image", "fornecedor"],
            [produto.marketId, produto.nome, produto.preco, produto.categoria, produto.departamento, produto.estoque, produto.lote, produto.validade, produto.fabricacao, produto.codigo, produto.imagem, produto.fornecedor]
        ); //

        const newProductId = result.id; //

        await insert("history",
            ["productId", "marketId", "userId", "type", "beforeData", "afterData", "createdAt"],
            [newProductId, produto.marketId, produto.userId, "entrada", null, JSON.stringify({ stock: produto.estoque, price: produto.preco, name: produto.nome }), new Date().toISOString()]
        ); //

        return res.status(201).json({ mensagem: "Produto adicionado com sucesso!", productId: newProductId }); //
    } catch (err) {
        console.error("Erro ao adicionar produto:", err); //
        if (err.message && err.message.startsWith("Tipo de arquivo não permitido")) { //
            return res.status(400).json({ erro: err.message }); //
        }
        return res.status(500).json({ erro: "Erro interno ao adicionar produto.", detalhes: err.message }); //
    }
};

// Função para DELETAR produto
const deletarProduto = async (req, res) => {
    const { productId, userId, marketId } = req.body; //
    if (!productId || !userId || !marketId) { //
        return res.status(400).json({ erro: "Parâmetros obrigatórios ausentes (productId, userId, marketId)." }); //
    }
    try {
        const produtos = await select("products", "WHERE productId = ? AND marketId = ?", [productId, marketId]); //
        if (!produtos || produtos.length === 0) { //
            return res.status(404).json({ erro: "Produto não encontrado neste mercado." }); //
        }
        const produtoDeletado = produtos[0]; //
        
        await insert("history",
            ["productId", "marketId", "userId", "type", "beforeData", "afterData", "createdAt"],
            [produtoDeletado.productId, produtoDeletado.marketId, parseInt(userId), "remocao", JSON.stringify(produtoDeletado), null, new Date().toISOString()]
        ); //
        
        await delet("products", "productId = ? AND marketId = ?", [productId, marketId]); //
        return res.status(200).json({ mensagem: "Produto deletado com sucesso!" }); //
    } catch (err) {
        console.error("Erro ao deletar produto:", err); //
        return res.status(500).json({ erro: "Erro interno ao deletar produto.", detalhes: err.message }); //
    }
};

// Função para EDITAR produto
const editarProduto = async (req, res) => {
    try {
        const {
            productId, name, price, category, departament, stock,
            lot, expirationDate, manufactureDate, barcode, marketId, userId
        } = req.body; //
        if (!productId || !name || !price || !category || !departament || !stock || !lot || !expirationDate || !manufactureDate || !barcode || !marketId || !userId) { //
            return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios." }); //
        }

        const oldDataResult = await select("products", "WHERE productId = ? AND marketId = ?", [productId, marketId]); //
        if (!oldDataResult || oldDataResult.length === 0) { //
            return res.status(404).json({ success: false, message: "Produto não encontrado neste mercado." }); //
        }
        const beforeData = oldDataResult[0]; //

        const columnsToUpdate = ["name", "price", "category", "departament", "stock", "lot", "expirationDate", "manufactureDate", "barcode"]; //
        const valuesToUpdate = [name, parseFloat(price), category, departament, parseInt(stock), lot, expirationDate, manufactureDate, barcode]; //
        
        await update("products", columnsToUpdate, valuesToUpdate, "productId = ? AND marketId = ?", [productId, marketId]); //
        
        const afterData = { name, price: parseFloat(price), category, departament, stock: parseInt(stock), lot, expirationDate, manufactureDate, barcode, marketId }; //
        
        await insert("history",
            ["productId", "marketId", "userId", "type", "beforeData", "afterData", "createdAt"],
            [productId, marketId, parseInt(userId), "edicao", JSON.stringify(beforeData), JSON.stringify(afterData), new Date().toISOString()]
        ); //
        
        return res.json({ success: true, message: "Produto atualizado com sucesso!" }); //
    } catch (err) {
        console.error("Erro ao editar produto:", err); //
        return res.status(500).json({ success: false, message: "Erro interno ao editar produto.", detalhes: err.message }); //
    }
};

// Função para CONSULTAR estoque
const consultarEstoque = async (req, res) => {
    const { busca, category, marketId } = req.body; //
    if (!marketId) { //
        return res.status(400).json({ erro: "marketId é obrigatório" }); //
    }
    try {
        let conditions = ["marketId = ?"]; //
        const params = [marketId]; //
        if (busca && busca.trim() !== "") { //
            conditions.push("(name LIKE ? OR productId LIKE ? OR barcode = ?)"); //
            const searchTerm = `%${busca.trim()}%`; //
            params.push(searchTerm, searchTerm, busca.trim()); //
        }
        if (category && category.trim() !== "" && category.toLowerCase() !== "todos") { //
            conditions.push("category = ?"); //
            params.push(category.trim()); //
        }
        const condicaoSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''; //
        const results = await select("products", condicaoSQL, params);
        if(req.body.quant)
        {
            var quantidadeEstoque = results[0]["stock"];
            if(req.body.quant > quantidadeEstoque) {
                return res.status(200).json({erro: "A quantidade solicitada excede o estoque disponível"})
            }
            else{
                var quantidadeEstoque = quantidadeEstoque - (req.body.quant)
                update("products", ["stock"], [quantidadeEstoque], `marketId = '${marketId}'`)
            }
        } //
        return res.status(200).json({ mensagem: results }); //
    } catch (err) {
        console.error("Erro ao consultar estoque:", err); //
        return res.status(500).json({ erro: "Erro ao consultar estoque.", detalhes: err.message }); //
    }
};

// Função para OBTER alertas
const getAlertas = async (req, res) => {
    const { marketId } = req.body; //
    try {
        const alerts = await select('products', 'WHERE marketId = ?', marketId); //
        res.status(200).json(alerts); //
    } catch (error) {
        console.log(error); //
        res.status(500).json({ erro: "Erro interno ao buscar alertas" });
    }
};

// Exporta todas as funções para serem usadas no arquivo de rotas
module.exports = {
    adicionarProduto,
    deletarProduto,
    editarProduto,
    consultarEstoque,
    getAlertas
};