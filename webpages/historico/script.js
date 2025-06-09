// DADOS DINÂMICOS
const produtos = [
    "Arroz", "Feijão", "Macarrão", "Açúcar", "Sal", "Óleo", "Café", "Farinha",
    "Milho", "Bolacha", "Achocolatado", "Sabão", "Shampoo", "Detergente",
    "Água sanitária", "Papel higiênico", "Pasta de dente", "Escova", "Alvejante", "Biscoito"
];

// FUNÇÃO PARA GERAR OS CARDS
function gerarCards() {
    const entradasContainer = document.getElementById("entradasAccordion");
    const saidasContainer = document.getElementById("saidasAccordion");
    const alteracoesContainer = document.getElementById("alteracoesAccordion");

    produtos.forEach((nome, i) => {
    const data = `2${Math.floor(Math.random() * 8) + 1}/05`;

    // ENTRADAS
    entradasContainer.innerHTML += `
        <div class="accordion-item">
        <h2 class="accordion-header" id="entrada${i}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#collapseEntrada${i}" aria-expanded="false">
            <i class="bi bi-box-arrow-in-down me-2 text-success"></i>${nome}
            <span class="badge bg-success ms-2">${data}</span>
            </button>
        </h2>
        <div id="collapseEntrada${i}" class="accordion-collapse collapse" aria-labelledby="entrada${i}">
            <div class="accordion-body">
            <div class="linha"><strong>Quantidade:</strong> ${Math.floor(Math.random() * 40 + 10)}</div>
            <div class="linha"><strong>Valor:</strong> R$ ${(Math.random() * 200).toFixed(2)}</div>
            <div class="linha"><strong>Fornecedor:</strong> Empresa ${i + 1}</div>
            </div>
        </div>
        </div>`;

    // SAÍDAS
    saidasContainer.innerHTML += `
        <div class="accordion-item">
        <h2 class="accordion-header" id="saida${i}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#collapseSaida${i}" aria-expanded="false">
            <i class="bi bi-box-arrow-right me-2 text-danger"></i>${nome}
            <span class="badge bg-danger ms-2">${data}</span>
            </button>
        </h2>
        <div id="collapseSaida${i}" class="accordion-collapse collapse" aria-labelledby="saida${i}">
            <div class="accordion-body">
            <div class="linha"><strong>Quantidade:</strong> ${Math.floor(Math.random() * 20 + 5)}</div>
            <div class="linha"><strong>Motivo:</strong> ${i % 2 === 0 ? "Vencido" : "Venda"}</div>
            </div>
        </div>
        </div>`;

    // ALTERAÇÕES
    alteracoesContainer.innerHTML += `
        <div class="accordion-item">
        <h2 class="accordion-header" id="alteracao${i}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#collapseAlteracao${i}" aria-expanded="false">
            <i class="bi bi-pencil-square me-2 text-primary"></i>${nome}
            <span class="badge bg-primary ms-2">${data}</span>
            </button>
        </h2>
        <div id="collapseAlteracao${i}" class="accordion-collapse collapse" aria-labelledby="alteracao${i}">
            <div class="accordion-body">
            <div class="alteracao-comparacao">
                <div class="antes">
                <h6><strong>Antes:</strong></h6>
                <div class="linha"><strong>Quantidade:</strong> ${Math.floor(Math.random() * 30 + 1)}</div>
                <div class="linha"><strong>Preço:</strong> R$ ${(Math.random() * 100).toFixed(2)}</div>
                </div>
                <div class="depois">
                <h6><strong>Depois:</strong></h6>
                <div class="linha"><strong>Quantidade:</strong> ${Math.floor(Math.random() * 30 + 1)}</div>
                <div class="linha"><strong>Preço:</strong> R$ ${(Math.random() * 100).toFixed(2)}</div>
                </div>
            </div>
            </div>
        </div>
        </div>`;
    });
}

// CARREGA OS CARDS QUANDO A PÁGINA ESTIVER PRONTA
document.addEventListener('DOMContentLoaded', gerarCards);

function pesquisarHistorico() {
    const termo = document.getElementById('pesquisa').value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria').value;

    // Simulação de busca: substitua com seus dados reais do Firebase ou onde estiver
    console.log(`Pesquisar: termo="${termo}", categoria="${categoria}"`);
    // Aqui você filtra os itens e exibe no resultado
}

function confirmarExclusao() {
    const valor = document.getElementById('campo-excluir').value.trim().toLowerCase();

    if (!valor) {
    alert('Digite um nome de produto ou categoria para apagar.');
    return;
    }

    const confirmar = confirm(`Tem certeza que deseja apagar "${valor}"? Essa ação não pode ser desfeita.`);
    if (confirmar) {
    // Aqui você identifica se é um produto ou categoria, e executa a exclusão
    console.log(`Apagar: "${valor}"`);
    // Função para deletar do banco
    }
}

async function verificUser(){
    fetch("/verific", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({busca: id, column: "userId", tableSelect :"users"})
    }).then( res => res.json())
    .then( data => {
    if (Object.keys(data.mensagem).length === 0){
        window.location.href = '/Error404'
    }
    else {
        document.getElementById('userName').textContent = data.mensagem[0].name;
        document.getElementById('userEmail').textContent = data.mensagem[0  ].email;
        document.getElementById('userRole').textContent = "Gerente";
    }
    }
    )
}