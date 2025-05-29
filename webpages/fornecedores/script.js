const { cmp } = require("semver");

async function adicionarFornecedor() {
    const cnpj = document.getElementById('cnpj').value;
    const razao_social = document.getElementById("razao_social").value;
    const inscricao_estadual = document.getElementById('inscricao_estadual').value;
    const endereco = document.getElementById("endereco").value;
    const contato = document.getElementById('contato').value;
    const tipo_de_produto = document.getElementById('tipo_de_produto').value;

    const res = await fetch('/addFornecedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
            cnpj: cnpj,
            razao_social: razao_social,
            inscricao_estadual: inscricao_estadual,
            endereco: endereco,
            contato: contato,
            tipo_de_produto: tipo_de_produto
        })
    })
}