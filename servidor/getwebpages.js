const fs = require('fs');
const path = require('path');

const webpages_dir = path.join(__dirname, '..', 'webpages');

fs.readdir(webpages_dir, (err, arquivos) => {
  if (err) {
    console.error('Erro lendo a pasta webpages:', err);
    return;
  }

  const pages = arquivos.filter(arquivo => {
    const caminho = path.join(webpages_dir, arquivo);
    return fs.statSync(caminho).isDirectory();
  });

  // Gera um arquivo JS com a lista pages
  module.exports = JSON.stringify(pages, null, 2);
});
