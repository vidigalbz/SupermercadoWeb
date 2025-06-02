
const container = document.getElementById('fornecedores-container')
let dataFornecedores = []

async function adicionarFornecedor() {
    const cnpj = document.getElementById('cnpj').value;
    const razao_social = document.getElementById("razaoSocial").value;
    const inscricao_estadual = document.getElementById('inscricaoEstadual').value;
    const endereco = document.getElementById("endereco").value;
    const contato = document.getElementById('contato').value;
    const tipo_de_produto = document.getElementById('tipoProduto').value;

    console.log("Entrou")
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

function criarCardFornecedor(fornecedor) {
    const div = document.createElement("div")
    div.className = 'col-md-3'
    div.innerHTML = `<div id="fornecedor-${fornecedor.cnpj}" class="card mb-3" style="border: 1px solid #dee2e6; max-width: 280px;">
                    <div class="row g-0">
                        <!-- Conteúdo -->
                        <div class="col-md-9">
                            <div class="card-body d-flex flex-column justify-content-between h-100">
                                <div>
                                    <h6 class="card-title mb-1 fw-bold">${fornecedor.razao_social}</h6>
                                    <p class="card-text mb-1"><strong>CNPJ:</strong> ${fornecedor.cnpj}</p>
                                    <p class="card-text mb-1"><strong>Tipo:</strong> ${fornecedor.tipo_de_produto}</p>
                                </div>

                                <!-- Botões -->
                                <div class="card-actions d-flex gap-2 mt-2">
                                    <button type="button" class="btn btn-sm btn-outline-primary btn-popover"
                                        data-bs-toggle="popover" data-bs-html="true" title="Detalhes do Fornecedor"
                                        data-bs-content="
                                            <strong>Razão Social:</strong> ${fornecedor.razao_social}<br>
                                            <strong>CNPJ:</strong> ${fornecedor.cnpj}<br>
                                            <strong>Inscrição Estadual:</strong> ${fornecedor.inscricao_estadual}<br>
                                            <strong>Tipo:</strong> ${fornecedor.tipo_de_produto}<br>
                                            <strong>Endereço:</strong> ${fornecedor.endereco}<br>
                                            <strong>Contato:</strong> ${fornecedor.contato}">
                                        <i class="bi bi-info-square"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>`
    container.appendChild(div)

    const popoverTriggerList = div.querySelectorAll('[data-bs-toggle="popover"]');
    popoverTriggerList.forEach(el => new bootstrap.Popover(el));
}


async function carregarFornecedor() {
    
    fetch("/fornecedorData", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).then(res => res.json()).then(data => {
        if(data.result){
            dataFornecedores = data.result
            renderizar(dataFornecedores)
        }
        else {
            console.log("Erro no fetch")
        }
    })
}

function renderizar(fornecedores){
    container.innerHTML = ''
    if(fornecedores){
        for(var fornecedor of fornecedores ){
            criarCardFornecedor(fornecedor)
        } 
    }
}

function carregarEdit(){
    let cnpjFornecedor = document.getElementById("codigo-editar").value;
    if (cnpjFornecedor == null) return;

    const produto = dataFornecedores.find(f => String(f.cnpj) === String(cnpjFornecedor));

    document.getElementById("cnpjEditar").value = produto.cnpj || ""
    document.getElementById("razaoSocialEditar").value = produto.razao_social || ""
    document.getElementById("inscricaoEstadualEditar").value = produto.inscricao_estadual || ''
    document.getElementById("enderecoEditar").value = produto.endereco || ''
    document.getElementById("tipoProdutoEditar").value = produto.tipo_de_produto || ''
    document.getElementById("contatoEditar").value = produto.contato || ''

}


function updateFornecedor(){
    
    var fornecedor = {
        cnpj: cnpj = document.getElementById("cnpjEditar").value,
        razaoSocial: razaoSocial = document.getElementById("razaoSocialEditar").value,
        inscricaoEstadual: inscricaoEstadual = document.getElementById("inscricaoEstadualEditar").value,
        tipoProduto: tipoProduto = document.getElementById("tipoProdutoEditar").value,
        endereco: endereco = document.getElementById("enderecoEditar").value,
        contato: contato = document.getElementById("contatoEditar").value,
    }

    fetch("/editar", {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(fornecedor)
    })
}

function excluirFornecedor() {
    const cnpjExcluir = document.getElementById("codigo-excluir").value;
    if(cnpjExcluir == null) return;
    fetch('/excluirFornecedor',{
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify({cnpj : cnpjExcluir})
    }).then(res => res.json())
    .then(data => {
        if (data.mesagem){
            

        }
    })
}

carregarFornecedor()

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

