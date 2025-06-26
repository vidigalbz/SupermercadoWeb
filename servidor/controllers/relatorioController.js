const { selectFromRaw } = require('../database');

exports.getRelatorioData = async (req, res) => {
    try {
        const { marketId, mes, ano } = req.body;
        const mesAnoFiltro = `${ano}-${String(mes + 1).padStart(2, '0')}`;

        console.log(`--> Gerando relatório para Mercado: ${marketId}, Período: ${mesAnoFiltro}`);


        const [hojeResult] = await selectFromRaw(
            `SELECT IFNULL(SUM(total), 0) AS totalVendas FROM sales WHERE marketId = ? AND DATE(saleDate) = DATE('now', 'localtime')`,
            [marketId]
        );

        const [semanaResult] = await selectFromRaw(
            `SELECT IFNULL(SUM(total), 0) AS totalVendas FROM sales WHERE marketId = ? AND DATE(saleDate) >= DATE('now', 'localtime', 'start of day', '-' || STRFTIME('%w', 'now', 'localtime') || ' days')`,
            [marketId]
        );

        const [mesResult] = await selectFromRaw(
            `SELECT IFNULL(SUM(total), 0) AS totalVendas FROM sales WHERE marketId = ? AND STRFTIME('%Y-%m', saleDate) = ?`,
            [marketId, mesAnoFiltro]
        );
        
        const desempenhoFinanceiro = await selectFromRaw(
            `SELECT DATE(saleDate) as dia, SUM(total) as totalDiario 
             FROM sales 
             WHERE marketId = ? AND STRFTIME('%Y-%m', saleDate) = ?
             GROUP BY dia 
             ORDER BY dia ASC`,
            [marketId, mesAnoFiltro]
        );

        const maisVendidos = await selectFromRaw(
           `SELECT p.name as nome, SUM(si.quantity) as qtd, SUM(si.subtotal) as precoTotal
            FROM sale_items si
            JOIN products p ON p.productId = si.productId
            JOIN sales s ON s.saleId = si.saleId
            WHERE s.marketId = ? AND STRFTIME('%Y-%m', s.saleDate) = ?
            GROUP BY p.productId, p.name
            ORDER BY qtd DESC LIMIT 10`,
            [marketId, mesAnoFiltro]
        );

        const produtosEncalhados = await selectFromRaw(
            `SELECT name, stock, expirationDate as validade, barcode as codigo 
             FROM products 
             WHERE marketId = ? AND stock > 0 AND productId NOT IN (
                 SELECT DISTINCT si.productId FROM sale_items si
                 JOIN sales s ON s.saleId = si.saleId
                 WHERE s.marketId = ? AND STRFTIME('%Y-%m', s.saleDate) = ?
             )`,
            [marketId, marketId, mesAnoFiltro]
        );

        const vendasPorCategoria = await selectFromRaw(
           `SELECT 
                p.category as categoria, 
                SUM(si.subtotal) as totalVendido
            FROM sale_items si
            JOIN products p ON p.productId = si.productId
            JOIN sales s ON s.saleId = si.saleId
            WHERE 
                s.marketId = ? AND 
                STRFTIME('%Y-%m', s.saleDate) = ? AND
                p.category IS NOT NULL AND p.category != ''
            GROUP BY 
                p.category
            ORDER BY 
                totalVendido DESC`,
            [marketId, mesAnoFiltro]
        );

        const curvaABC_Dinamica = {
            labels: vendasPorCategoria.map(item => item.categoria),
            dados: vendasPorCategoria.map(item => item.totalVendido)
        };

        const dadosFinais = {
            vendas: {
                hoje: [hojeResult.totalVendas, 0],
                semana: [semanaResult.totalVendas, 0],
                mes: [mesResult.totalVendas, 0]
            },
            desempenhoFinanceiro: desempenhoFinanceiro,
            curvaABC: curvaABC_Dinamica,
            maisVendidos: maisVendidos,
            produtosEncalhados: produtosEncalhados
        };

        res.status(200).json(dadosFinais);

    } catch (error) {
        console.error("ERRO GRAVE no controller do relatório:", error);
        res.status(500).json({ error: "Ocorreu um erro interno no servidor ao gerar o relatório." });
    }
};