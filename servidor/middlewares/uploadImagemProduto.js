const path = require("path");
const fs = require("fs");
const multer = require("multer");
const os = require("os");

// Definir uma pasta externa para uploads (evita problemas com pkg)
const baseUploadDir = path.join(os.tmpdir(), "SupermercadoWebUploads");

// Pasta de uploads de produtos
const uploadsDir = path.join(baseUploadDir, "produtos");

// Criar pasta se não existir
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do armazenamento de imagens de produtos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `imagem-${Date.now()}${ext}`);
    }
});

// Filtro para aceitar apenas tipos de imagens válidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimeType && extName) {
        cb(null, true);
    } else {
        cb(new Error("Tipo de arquivo não permitido. Apenas imagens são aceitas."));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: fileFilter,
});

module.exports = {
    uploadProduto: upload,
    uploadsDir, // exportar o caminho caso precise usar externamente
};
