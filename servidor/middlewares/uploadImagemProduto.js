const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Configuração de pastas de upload
const uploadsDir = path.join(__dirname, 'servidor/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do armazenamento de imagens de produtos
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `imagem-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extName) {
            return cb(null, true);
        }
        cb(new Error("Tipo de arquivo não permitido. Apenas imagens são aceitas."));
    }
});

module.exports = {
    uploadProduto: upload,
};
