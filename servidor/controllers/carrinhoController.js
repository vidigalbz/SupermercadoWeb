const { db, select, insert, update, query } = require('../database.js');

const getCarrinho = (req, res) => {
    const carrinho = req.cookies.carrinho || {};
    res.json({ carrinho });
};

const addCarrinho = async (req, res) => {
    const carrinhoData = req.body.carrinho;
    if (!carrinhoData) {
        return res.status(400).send('Dados do carrinho não recebidos corretamente.');
    }
    res.cookie('carrinho', carrinhoData, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    });
    return res.status(200).json({ mensagem: "Carrinho atualizado nos cookies.", data: carrinhoData });
};

const finalizarCompra = async (req, res) => {
    try {
        const { items, total, paymentMethod, marketId, userId } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Nenhum item na compra' });
        }
        if (!total || isNaN(parseFloat(total)) || parseFloat(total) <= 0) {
            return res.status(400).json({ error: 'Total inválido' });
        }
        if (!paymentMethod || !['cash', 'credit', 'debit', 'pix'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Método de pagamento inválido' });
        }
        if (!marketId || typeof marketId !== 'string') {
            return res.status(400).json({ error: 'ID do mercado inválido' });
        }
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'ID do usuário inválido' });
        }

        for (const item of items) {
            if (
                isNaN(parseInt(item.productId)) || parseInt(item.productId) <= 0 ||
                isNaN(parseInt(item.quantity)) || parseInt(item.quantity) <= 0 ||
                isNaN(parseFloat(item.unitPrice)) || parseFloat(item.unitPrice) < 0 ||
                isNaN(parseFloat(item.subtotal)) || parseFloat(item.subtotal) < 0
            ) {
                return res.status(400).json({ error: `Item inválido na compra: ${JSON.stringify(item)}` });
            }
        }

        const marketExists = await select("supermarkets", "WHERE marketId = ?", [marketId]);
        if (marketExists.length === 0) {
            return res.status(400).json({ error: `Mercado com ID ${marketId} não existe.` });
        }

        await query("BEGIN TRANSACTION");
        const saleDate = new Date().toISOString();
        const saleResult = await insert("sales",
            ["marketId", "total", "paymentMethod", "saleDate"],
            [marketId, parseFloat(total), paymentMethod, saleDate]
        );
        const saleId = saleResult.id;
        if (!saleId) throw new Error('Falha ao registrar venda.');

        for (const item of items) {
            const products = await select("products",
                "WHERE productId = ? AND marketId = ?",
                [parseInt(item.productId), marketId]
            );
            if (products.length === 0) {
                await query("ROLLBACK");
                return res.status(400).json({ error: `Produto ${item.productId} não encontrado no mercado ${marketId}` });
            }
            const product = products[0];
            const currentStock = product.stock;
            if (currentStock < parseInt(item.quantity)) {
                await query("ROLLBACK");
                return res.status(400).json({ error: `Estoque insuficiente para produto ${product.name} (ID: ${item.productId})` });
            }
            const newStock = currentStock - parseInt(item.quantity);

            await insert("sale_items",
                ["saleId", "productId", "quantity", "unitPrice", "subtotal"],
                [saleId, parseInt(item.productId), parseInt(item.quantity), parseFloat(item.unitPrice), parseFloat(item.subtotal)]
            );
            await update("products",
                ["stock"], [newStock],
                "productId = ? AND marketId = ?", [parseInt(item.productId), marketId]
            );
            await insert("history", [
                "productId", "marketId", "userId", "type", "beforeData", "afterData", "createdAt"
            ], [
                parseInt(item.productId), marketId, parseInt(userId), 'saida',
                JSON.stringify({ stock: currentStock, price: product.price, name: product.name }),
                JSON.stringify({ stock: newStock }),
                new Date().toISOString()
            ]);
        }

        await query("COMMIT");
        res.clearCookie('carrinho');
        return res.status(201).json({ success: true, saleId, message: 'Compra finalizada com sucesso' });
    } catch (error) {
        await query("ROLLBACK").catch(rbError => console.error('Erro no rollback:', rbError));
        console.error('Erro ao processar /finalizarCompra:', error);
        return res.status(500).json({ error: 'Erro ao processar a compra', message: error.message });
    }
};

module.exports = {
    getCarrinho,
    addCarrinho,
    finalizarCompra
};