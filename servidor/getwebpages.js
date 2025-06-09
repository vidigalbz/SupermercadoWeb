const fs = require('fs');
const path = require('path');

const webpages_dir = path.join(__dirname, '..', 'webpages');

try {
  const arquivos = fs.readdirSync(webpages_dir);
  const pages = arquivos.filter(arquivo => {
    const caminho = path.join(webpages_dir, arquivo);
    return fs.statSync(caminho).isDirectory();
  });

  module.exports = pages; // Exporta o array diretamente, não precisa stringify
} catch (err) {
  console.error('Erro lendo a pasta webpages:', err);
  module.exports = []; // Exporta array vazio em caso de erro
}