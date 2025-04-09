const searchInput = document.getElementById("pesquisa");
const container = document.getElementById("produtos-container");

function criarCardHTML(produto) {
  return `
    <div class="card-produto" data-id="${produto.productId}">
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

function atualizarOuAdicionarCard(produto) {
  const cardExistente = container.querySelector(`.card-produto[data-id="${produto.productId}"]`);
  const novoHTML = criarCardHTML(produto);

  if (cardExistente) {
    cardExistente.outerHTML = novoHTML;
  } else {
    container.insertAdjacentHTML("beforeend", novoHTML);
  }
}

function renderizarProdutos(produtos) {
  const idsNovos = produtos.map(p => p.productId);
  const cardsAtuais = Array.from(container.querySelectorAll('.card-produto'));

  // Remover os que não estão na nova lista
  for (let card of cardsAtuais) {
    if (!idsNovos.includes(card.dataset.id)) {
      card.remove();
    }
  }

  // Atualizar ou adicionar
  for (let produto of produtos) {
    atualizarOuAdicionarCard(produto);
  }

  // Ativar os popovers
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
  for (let i = 0; i < popoverTriggerList.length; i++) {
    new bootstrap.Popover(popoverTriggerList[i]);
  }
}

// Buscar ao iniciar
function carregarProdutos() {
  fetch('/estoqueData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
    .then(res => res.json())
    .then(data => {
      console.log('Dados recebidos:', data);
      renderizarProdutos(data.mensagem);
    })
    .catch(err => console.error('Erro ao carregar produtos:', err));
}

carregarProdutos();

// Botão de recarregar
document.getElementById("btn-recarrega-estoque").addEventListener("click", () => {
  carregarProdutos();
});

// Buscar via input
function search() {
  fetch(`/estoqueData?conditional=WHERE name LIKE '%${searchInput.value}%'`, {
    method: 'POST'
  })
    .then(res => res.json())
    .then(data => {
      renderizarProdutos(data.mensagem);
    })
    .catch(err => console.error('Erro:', err)); 
}

async function adicionarProduto () {
  const nome = document.getElementById("produto-nome").value.trim();
  const codigo = document.getElementById("produto-barcode").value.trim();
  const preco = parseFloat(document.getElementById("add-preco").value);
  const categoria = document.getElementById("add-categoria").value;
  const estoque = parseInt(document.getElementById("produto-estoque").value);
  const lote = document.getElementById("produto-lote").value.trim();
  const departamento = document.getElementById("add-departamento").value;
  const marketId = document.getElementById("produto-marketId").value.trim();
  const fabricacao = document.getElementById("produto-fabricacao").value;
  const validade = document.getElementById("produto-validade").value;
  const imagemInput = document.getElementById("produto-imagem");

  if (!nome || !codigo || isNaN(preco) || isNaN(estoque) || !marketId) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return false;
  }

  const formData = new FormData();
  formData.append("nome", nome);
  formData.append("codigo", codigo);
  formData.append("preco", preco);
  formData.append("categoria", categoria);
  formData.append("estoque", estoque);
  formData.append("lote", lote);
  formData.append("departamento", departamento);
  formData.append("marketId", marketId);
  formData.append("fabricacao", fabricacao);
  formData.append("validade", validade);

  if (imagemInput.files.length > 0) {
    formData.append("imagem", imagemInput.files[0]);
  }

  try {
    const res = await fetch("/adicionarProduto", {
      method: "POST",
      body: formData,
    });

    const resultado = await res.json();

    if (res.ok) {
      alert("Produto adicionado com sucesso!");
      document.getElementById("form-adicionar-item").reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById("modalAdicionarItem"));
      modal.hide();
      document.getElementById("btn-recarrega-estoque").click();
      return true;
    } else {
      alert("Erro ao adicionar produto: " + (resultado.erro || "Erro desconhecido."));
    }
  } catch (err) {
    alert("Erro na requisição: " + err.message);
  }
}
