const fs = require("fs");
const path = require("path");

// Importa apenas os nomes das páginas válidas
const pages = require("./pages"); // <-- adaptado para importar o segundo módulo

async function loadPages(app, webpages_dir) {
    try {
        for (const page of pages) {
            const indexPath = path.join(webpages_dir, page, "index.html");

            if (fs.existsSync(indexPath)) {
                console.log(`[ROUTE] ${page}`);
                const routePath = page.toLowerCase() === "main" ? "/" : `/${page}`;
                app.get(routePath, (req, res) => res.sendFile(indexPath));
            }
        }
    } catch (err) {
        console.error("[DEBUG] Erro ao carregar páginas:", err);
    }
}

function error404Page(req, res) {
    const pathError = path.join(__dirname, "..", "webpages", "erro404", "index.html");
    if (fs.existsSync(pathError)) {
        return res.status(404).sendFile(pathError);
    }
    return res.status(404).send("<h1>404 - Página não encontrada</h1>");
}

module.exports = { loadPages, error404Page };
