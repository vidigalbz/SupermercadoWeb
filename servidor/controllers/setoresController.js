const { insert, select, update, delet } = require('../database.js');

const getSetor = async (req, res) => {
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
};

const addSetor = async(req, res) => {
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
};

const deleteSetor = async (req, res) => {
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
};

module.exports = {
    getSetor,
    addSetor,
    deleteSetor,
};

