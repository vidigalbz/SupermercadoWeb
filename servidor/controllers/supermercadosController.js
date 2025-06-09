const { insert, select, update, delet } = require('../database.js');

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

const adicionarSupermercado = async (req, res) => {
    console.log("a função esta sendo chamada!");
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
};

const listarSupermercados = async (req, res) => {
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
};

const deletarSupermercado = async (req, res) => {
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
};

const  supermercadoData = async (req, res) => {
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
};

const updateSupermercado = async (req, res) => {
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
};

module.exports = {
    adicionarSupermercado,
    listarSupermercados,
    deletarSupermercado,
    supermercadoData,
    updateSupermercado
}