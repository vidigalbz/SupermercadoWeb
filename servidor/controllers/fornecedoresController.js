const { insert, select, update, delet } = require('../database.js');

const addFornecedor = async (req, res) => {
    const {
        cnpj,
        razao_social,
        inscricao_estadual,
        endereco,
        contato,
        tipo_de_produto
    } = req.body;
    try {
        await insert(
            "fornecedores",
            ["cnpj", "razao_social", "inscricao_estadual", "endereco", "contato", "tipo_de_produto"],
            [cnpj, razao_social, inscricao_estadual, endereco, contato, tipo_de_produto]
        );
        res.json({
            status: "success"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Erro ao adicionar fornecedor." });
    }
};

const getFornecedores = async (req, res) => {
    try {
        const data = await select("fornecedores");
        res.status(200).json({ result: data });
    } catch (e) {
        res.status(500).json({ erro: e });
    }
};

const editarFornecedor = async (req, res) => {
    const {
        cnpj,
        razaoSocial,
        inscricaoEstadual,
        tipoProduto,
        endereco,
        contato,
    } = req.body;

    try {
        const result = await update("fornecedores",
            ["razao_social", "inscricao_estadual", "endereco", "contato", "tipo_de_produto"],
            [razaoSocial, inscricaoEstadual, endereco, contato, tipoProduto],
            `cnpj = ?`,
            [cnpj]
        );
        if (result.changes > 0) {
            res.status(200).json({ status: "success", message: "Fornecedor atualizado com sucesso." });
        } else {
            res.status(404).json({ erro: "Fornecedor não encontrado." });
        }
    } catch (e) {
        res.status(500).json({ erro: "Não ocorreu como Devia ter ocorrido" });
    }
};

const excluirFornecedor = async (req, res) => {
    const { cnpj } = req.body;
    if (!cnpj) return res.status(400).json({ erro: "Cnpj não encontrado" });

    try {
        const result = await delet("fornecedores", `cnpj = ?`, [cnpj]);
        if (result.changes > 0) {
            return res.status(200).json({ mensagem: "Excluido com Sucesso" });
        } else {
            return res.status(404).json({ erro: "Fornecedor não encontrado para exclusão." });
        }
    } catch (e) {
        res.status(500).json({ erro: "Erro ao excluir fornecedor." });
    }
};

const comprarDoFornecedor = async (req, res) => {
    const {
        cnpj,
        productId,
        quantidade_produto,
        data_compra,
        preco_unitario,
        subtotal_produto,
        valor_final,
    } = req.body;
    try {
        await insert(
            "comprarfornecedor",
            ["cnpj", "productId", 'quantidade_produto', 'data_compra', 'preco_unitario', 'subtotal_produto', 'valor_final'],
            [cnpj, productId, quantidade_produto, data_compra, preco_unitario, subtotal_produto, valor_final]
        );
        res.json({
            status: "success"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Erro ao registrar compra do fornecedor." });
    }
};

module.exports = {
    addFornecedor,
    getFornecedores,
    editarFornecedor,
    excluirFornecedor,
    comprarDoFornecedor
};