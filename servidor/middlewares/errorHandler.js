const multer = require("multer");

function errorHandler(err, req, res, next) {
    console.error("[DEBUG] Erro não tratado:", err.stack);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ erro: `Erro no upload: ${err.message}` });
    }
    if (err.message && err.message.startsWith("Tipo de arquivo não permitido")) {
        return res.status(400).json({ erro: err.message });
    }
    return res.status(500).json({ erro: 'Algo deu muito errado no servidor!', detalhes: err.message || 'Erro desconhecido' });
}

module.exports = { errorHandler };
