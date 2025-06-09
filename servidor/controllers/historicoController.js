const { select, selectFromRaw } = require('../database.js');

const getHistoricoData = async (req, res) => {
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
        return res.json({ success: true, data: processed });
    } catch (err) {
        console.error("Erro no /historicoData:", err);
        return res.status(500).json({ success: false, error: "Erro interno ao processar histórico", detalhes: err.message });
    }
};

module.exports = {
    getHistoricoData
};