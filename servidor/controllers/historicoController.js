// controllers/historicoController.js

const { selectFromRaw } = require('../database.js'); // Verifique se o caminho para o seu database.js está correto

const getHistoricoData = async (req, res) => {
    // O 'userId' NÃO é mais pego do corpo da requisição.
    const { marketId, busca } = req.body;

    // A verificação de 'userId' foi REMOVIDA.
    if (!marketId) {
        return res.status(400).json({ success: false, error: "Parâmetro 'marketId' é obrigatório" });
    }

    try {
        // =====================================================================
        // O BLOCO INTEIRO DE VERIFICAÇÃO DE PERMISSÃO FOI REMOVIDO DAQUI.
        // O código agora confia que o marketId recebido é o correto.
        // =====================================================================

        let conditions = ["h.marketId = ?"];
        const params = [marketId];

        if (busca && busca.trim() !== '') {
            conditions.push("(p.name LIKE ? OR p.barcode = ? OR h.productId LIKE ?)");
            const searchTerm = `%${busca.trim()}%`;
            params.push(searchTerm, busca.trim(), searchTerm);
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
                p.barcode
            FROM history h
            LEFT JOIN products p ON h.productId = p.productId
            WHERE ${conditions.join(" AND ")}
            ORDER BY h.createdAt DESC
            LIMIT 500
        `;

        const historico = await selectFromRaw(sql, params);

        const processed = historico.map(item => {
            try {
                return {
                    ...item,
                    beforeData: JSON.parse(item.beforeData || '{}'),
                    afterData: JSON.parse(item.afterData || '{}'),
                };
            } catch (e) {
                console.error("Erro ao parsear JSON no histórico:", e, "Item:", item);
                return null;
            }
        }).filter(Boolean); // Remove itens que falharam no parse

        return res.json({ success: true, data: processed });

    } catch (err) {
        console.error("Erro no /historicoData:", err);
        return res.status(500).json({ success: false, error: "Erro interno ao processar histórico", detalhes: err.message });
    }
};

module.exports = {
    getHistoricoData
};