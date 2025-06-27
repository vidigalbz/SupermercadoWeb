const fs = require("fs");
const path = require("path");

async function loadPages(app, webpages_dir) {
    try {
        if (!fs.existsSync(webpages_dir)) return;
        const arquivos = await fs.promises.readdir(webpages_dir);
        for (const arquivo of arquivos) {
            const caminho = path.join(webpages_dir, arquivo);
            const stat = await fs.promises.stat(caminho);
            if (stat.isDirectory()) {
                const indexPath = path.join(caminho, "index.html");
                if (fs.existsSync(indexPath)) {
                    console.log(arquivo)
                    const routePath = arquivo.toLowerCase() === "main" ? "/" : `/${arquivo}`;
                    app.get(routePath, (req, res) => res.sendFile(indexPath));
                }
            }
        }
    } catch (err) {
        console.error("[DEBUG] Erro ao carregar páginas:", err);
    }
}

function error404Page(req, res) {
    const pathError = path.join(__dirname, "../../webpages/erro404/index.html");
    if (fs.existsSync(pathError)) {
        return res.status(404).sendFile(pathError);
    }
    return res.status(404).send("<h1>404 - Página não encontrada</h1>");
}

module.exports = { loadPages, error404Page };
