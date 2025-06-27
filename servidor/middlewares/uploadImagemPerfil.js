const express = require('express');
const router = express.Router();
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { insert, select, update, delet } = require('../database.js');

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Pasta "uploads/profiles" uma pasta acima da atual (__dirname)
        const dir = path.join(__dirname, "..", "uploads", "profiles");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const userId = req.body.userId || "unknown";
        const ext = path.extname(file.originalname);
        cb(null, `profile-${userId}-${Date.now()}${ext}`);
    }
});
const uploadProfile = multer({ storage: profileStorage });

router.post("/uploadProfileImage", uploadProfile.single("profileImage"), async (req, res) => {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ status: "error", message: "UserId não fornecido" });
      }
      if (!req.file) {
        return res.status(400).json({ status: "error", message: "Nenhum arquivo enviado" });
      }

      const rows = await select("users", "WHERE userId = ?", [userId]);
      if (rows && rows.length > 0) {
        const oldPath = rows[0].profileImage;
        if (oldPath) {
          // Ajuste para remover um nível acima do __dirname também aqui
          const fullOldPath = path.join(__dirname, "..", oldPath);
          if (fs.existsSync(fullOldPath)) {
            fs.unlinkSync(fullOldPath);
          }
        }
      }

      // Ajuste o caminho relativo também com '..'
      const relativePath = path.relative(path.join(__dirname, ".."), req.file.path).replace(/\\/g, "/");
      await update("users", ["profileImage"], [relativePath], `userId = '${userId}'`);

      return res.status(200).json({
        status: "success",
        profileImage: relativePath
      });
    } catch (err) {
      console.error("Erro em /uploadProfileImage:", err);
      return res.status(500).json({ status: "error", message: "Erro interno no servidor" });
    }
  }
);

router.post("/removeProfileImage", async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ status: "error", message: "UserId não fornecido" });
    }

    const rows = await select("users", "WHERE userId = ?", [userId]);
    if (rows && rows.length > 0) {
      const oldPath = rows[0].profileImage;
      if (oldPath) {
        const fullOldPath = path.join(__dirname, "..", oldPath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }
    }

    await update("users", ["profileImage"], [null], `userId = '${userId}'`);
    return res.status(200).json({ status: "success", message: "Imagem removida" });
  } catch (err) {
    console.error("Erro em /removeProfileImage:", err);
    return res.status(500).json({ status: "error", message: "Erro interno no servidor" });
  }
});

module.exports = router;