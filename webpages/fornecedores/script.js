const { cmp } = require("semver");

async function adicionarFornecedor() {
    const cnpj = document.getElementById('cnpj').value;
    const razao_social = document.getElementById("razao_social").value;
    const inscricao_estadual = document.getElementById('inscricao_estadual').value;
    const endereco = document.getElementById("endereco").value;
    const contato = document.getElementById('contato').value;
    const tipo_de_produto = document.getElementById('tipo_de_produto').value;

    await fetch('/addFornecedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cnpj: cnpj,
            razao_social: razao_social,
            inscricao_estadual: inscricao_estadual,
            endereco: endereco,
            contato: contato,
            tipo_de_produto: tipo_de_produto
        })
    }).then(res => res.json()).then(data => {
        
    })
}

async function comprardofornecedor() {
    const cnpj = document.getElementById('cnpj').value;
    const productId = document.getElementById("productId").value;
    const quantidade_produto = document.getElementById('quantidade_produto').value;
    const data_compra = document.getElementById("data_compra").value;
    const preco_unitario = document.getElementById('preco_unitario').value;
    const subtotal_produto = document.getElementById('subtotal_produto').value;
    const valor_final = document.getElementById('valor_final').value;


    await fetch('/comprardofornecedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cnpj: cnpj,
            productId: productId,
            quantidade_produto: quantidade_produto,
            data_compra: data_compra,
            preco_unitario: preco_unitario,
            subtotal_produto: subtotal_produto,
            valor_final: valor_final,
        })
    }).then(res => res.json()).then(data => {
        
    }) 
}

