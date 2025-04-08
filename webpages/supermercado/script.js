const searchInput = document.getElementById("pesquisa");
const container = document.getElementById("produtos-container");

function criarCardHTML(produto) {
  return `
    <div class="card-produto">
      <div class="imagem-produto">IMG</div>
      <div class="info-produto">
        <div><strong>Nome:</strong> ${produto.name}</div>
        <div><strong>Cód:</strong> ${produto.productId}</div>
        <div><strong>Setor:</strong> ${produto.department}</div>
        <div><strong>Est:</strong> ${produto.lot}</div>
        <button type="button" class="btn btn-light btn-sm" 
                data-bs-toggle="popover"
                title="Detalhes"
                data-bs-html="true"
                data-bs-content="
                  <strong>Nome:</strong> ${produto.name}<br>
                  <strong>Código:</strong> ${produto.productId}<br>
                  <strong>Setor:</strong> ${produto.department}<br>
                  <strong>Lote:</strong> ${produto.lot}<br>
                  <strong>Preço:</strong> R$ ${produto.price.toFixed(2)}<br>
                  <strong>Qtd:</strong> ${produto.stock} unidades<br>
                  <strong>Validade:</strong> ${produto.expirationDate}<br>
                  <strong>Fabricação:</strong> ${produto.manufactureDate}">
          Ver mais
        </button>
      </div>
    </div>
  `;
}

function renderizarProdutos(produtos) {
  container.innerHTML = ""; // limpa antes

  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i];
    const cardHTML = criarCardHTML(produto);
    container.insertAdjacentHTML("beforeend", cardHTML);
  }

  // Ativar os popovers após inserção
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
  for (let i = 0; i < popoverTriggerList.length; i++) {
    new bootstrap.Popover(popoverTriggerList[i]);
  }
}


// Carregar produtos ao iniciar
fetch('/estoqueData', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({}) // corpo vazio ou algo que a API aceite
})
  .then(res => res.json())
  .then(data => {
    console.log('Dados recebidos:', data);
    renderizarProdutos(data.mensagem); // data deve ser um array
  })
  .catch(err => console.error('Erro ao carregar produtos:', err));


// Buscar via input (mantendo sua lógica)
function search() {
  console.log(searchInput.value)
  fetch(`/estoqueData?conditional=WHERE name LIKE '%${searchInput.value}%'`, {
    method: 'POST'
  })
    .then(res => res.json())
    .then(data => {
      console.log('Resposta do servidor:', data);
      renderizarProdutos(data.mensagem);
    })
    .catch(err => console.error('Erro:', err)); 
}
