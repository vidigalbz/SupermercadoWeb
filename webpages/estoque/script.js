const container = document.getElementById("produtos-container");
const filterCategoria = document.getElementById("filtro-categoria");
const filterDepartamento = document.getElementById("filtro-departamento");

var categoriaValue = "Todos";

function reloadPage() {
  location.reload()
}

function getQueryParam(paramName) {
  const queryString = window.location.search.substring(1);
  const params = queryString.split('&');

  for (const param of params) {
    const [key, value] = param.split('=');
    if (key === paramName) {
      return decodeURIComponent(value || '');
    }
  }
  return null;
}

function verificSuper(){
    fetch("/verific", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({busca: id, column: "marketId", tableSelect :"supermarkets"})
    }).then( res => res.json())
    .then( data => {
      if (Object.keys(data.mensagem).length === 0){
        window.location.href = '/Error404'
      } else {
        // Atualiza o nome do supermercado
        const supermarketName = data.mensagem[0].name;
        document.getElementById("supermarket-name").textContent = "Super Mercado: " + supermarketName;
      }
    })
    .catch(err => console.error('Erro ao verificar supermercado:', err));
}

const id = getQueryParam('id');
document.getElementById("produto-marketId").value = id;
verificSuper()
console.log(id);


filterCategoria.addEventListener("change", () => {
  categoriaValue = filterCategoria.value;
  console.log(categoriaValue);
  const valorBusca = document.getElementById("pesquisa").value.trim();
  fetch('/estoqueData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: categoriaValue, marketId: id })
  })
    .then(res => res.json())
    .then(data => {
      renderizarProdutos(data.mensagem);
    })
    .catch(err => console.error('Erro:', err));
})

filterDepartamento.addEventListener("change", () => {
  categoriaValue = filterCategoria.value;
  console.log(categoriaValue);
  const valorBusca = document.getElementById("pesquisa").value.trim();
  fetch('/estoqueData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: categoriaValue, marketId: id })
  })
    .then(res => res.json())
    .then(data => {
      console.log(data.mensagem)
      renderizarProdutos(data.mensagem);
    })
    .catch(err => console.error('Erro:', err));
})

var currentData = []

async function getImageURL(rawImagePath) {
  const response = await fetch('/api/ip');
  const data = await response.json();
  const ip = data.ip;
  
  return rawImagePath 
    ? `http://${ip}:4000/${rawImagePath}` 
    : 'https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1';
}

async function criarCardHTML(produto) {
  var rawImagePath = ""
  if (produto.image != null){
    rawImagePath = produto.image.replace(/\\/g, '/')
  }

  const imagemURL = await  getImageURL(rawImagePath);

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = `
    <div class="card-produto d-flex mb-3" data-id="${produto.productId}" style="border-radius: 10px; overflow: hidden;">
      <div class="imagem-produto" style="background-image: url('${imagemURL}'); width: 120px; background-size: cover;"></div>
      <div class="info-produto p-2 text-white" style="background-color: #009cbf; flex: 1;">
        <div><strong>Nome:</strong> ${produto.name}</div>
        <div><strong>Cód. de Barras:</strong> ${produto.barcode}</div>
        <div class="mt-2 d-flex gap-2">
          <button type="button" class="btn btn-light btn-sm btn-copiar"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Copiar código de Sistema">
            <i class="bi bi-clipboard"></i>
          </button>
          <button type="button" class="btn btn-light btn-sm btn-popover"
                  data-bs-toggle="popover"
                  title="Detalhes"
                  data-bs-html="true"
                  data-bs-content="
                    <strong>Nome:</strong> ${produto.name}<br>
                    <strong>Código de Barras:</strong> ${produto.barcode}<br>
                    <strong>Código de Sistema:</strong> ${produto.productId}<br>
                    <strong>Preço:</strong> R$ ${produto.price.toFixed(2)}<br>
                    <strong>Categoria:</strong> ${produto.category}<br>
                    <strong>Estoque:</strong> ${produto.stock} unidades<br>
                    <strong>Lote:</strong> ${produto.lot}<br>
                    <strong>Departamento:</strong> ${produto.departament}<br>
                    <strong>Validade:</strong> ${produto.expirationDate}<br>
                    <strong>Fabricação:</strong> ${produto.manufactureDate}">
            <i class="bi bi-info-circle"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const cardElement = tempDiv.firstElementChild;
  container.appendChild(cardElement);

  const btnCopiar = cardElement.querySelector('.btn-copiar');
  const btnPopover = cardElement.querySelector('.btn-popover');

  new bootstrap.Tooltip(btnCopiar);
  new bootstrap.Popover(btnPopover, {
    trigger: 'focus'
  });

  btnCopiar.addEventListener('click', () => {
    navigator.clipboard.writeText(produto.productId).then(() => {
      btnCopiar.innerHTML = '<i class="bi bi-check-lg"></i>';
      btnCopiar.setAttribute('title', 'Copiado!');
      const tooltip = bootstrap.Tooltip.getInstance(btnCopiar);
      tooltip.setContent({ '.tooltip-inner': 'Copiado!' });
      tooltip.show();

      setTimeout(() => {
        btnCopiar.innerHTML = '<i class="bi bi-clipboard"></i>';
        btnCopiar.setAttribute('title', 'Copiar código de Sistema');
        tooltip.setContent({ '.tooltip-inner': 'Copiar código de Sistema' });
      }, 2000);
    });
  });
}

function mostrarNotificacao(titulo, mensagem, tipo = 'info') {
  const toastEl = document.getElementById('liveToast');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');
  
  // Configura cores baseadas no tipo
  const tipos = {
    success: { bg: 'bg-success text-white', icon: '✔️' },
    error: { bg: 'bg-danger text-white', icon: '❌' },
    warning: { bg: 'bg-warning text-dark', icon: '⚠️' },
    info: { bg: 'bg-info text-dark', icon: 'ℹ️' }
  };
  
  const config = tipos[tipo] || tipos.info;
  
  // Atualiza o toast
  toastTitle.textContent = `${config.icon} ${titulo}`;
  toastMessage.textContent = mensagem;
  
  // Remove classes anteriores e adiciona as novas
  toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-white', 'text-dark');
  toastEl.classList.add(config.bg.split(' ')[0], config.bg.split(' ')[1]);
  
  // Mostra o toast
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
  
  // Esconde automaticamente após 5 segundos
  setTimeout(() => toast.hide(), 5000);
}

function atualizarOuAdicionarCard(produto) {
  const cardExistente = container.querySelector(`.card-produto[data-id="${produto.productId}"]`);
  if (cardExistente) {
    cardExistente.remove();
  }
  criarCardHTML(produto);
}

function renderizarProdutos(produtos) {
  const idsNovos = produtos.map(p => p.productId);
  const cardsAtuais = Array.from(container.querySelectorAll('.card-produto'));

  for (let card of cardsAtuais) {
    if (!idsNovos.includes(parseInt(card.dataset.id))) {
      card.remove();
    }
  }

  for (let produto of produtos) {
    atualizarOuAdicionarCard(produto);
  }
}

function carregarProdutos() {
  fetch('/estoqueData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ marketId: id })
  })
    .then(res => res.json())
    .then(data => {
      currentData = data.mensagem;
      console.log(data.mensagem)
      renderizarProdutos(data.mensagem);
      console.log(`${data.mensagem.image}`)
    })
    .catch(err => console.error('Erro ao carregar produtos:', err));
}

document.getElementById("btn-recarrega-estoque").addEventListener("click", () => {
  carregarProdutos();
});


function search() {
  const valorBusca = document.getElementById("pesquisa").value.trim();
  fetch('/estoqueData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ busca: valorBusca,
                           marketId: id
     })
  })
    .then(res => res.json())
    .then(data => {
      renderizarProdutos(data.mensagem);
    })
    .catch(err => console.error('Erro:', err));
}

async function adicionarProduto() {
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
    mostrarNotificacao('Atenção', 'Por favor, preencha todos os campos obrigatórios.', 'warning');
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

  console.log(categoria)

  // Verifique se a imagem foi selecionada antes de anexar
  if (imagemInput.files.length > 0) {
    formData.append("imagem", imagemInput.files[0]);
  }
  else{
    formData.append("imagem", '')
  }

  try {
    const res = await fetch("/adicionarProduto", {
      method: "POST",
      body: formData
    });

    const resultado = await res.json();

    if (res.ok) {
      mostrarNotificacao('Sucesso', 'Produto adicionado com sucesso!', 'success');
      document.getElementById("form-adicionar-item").reset();
      bootstrap.Modal.getInstance(document.getElementById("modalAdicionarItem")).hide();
      location.reload();
      return true;
    } else {
      mostrarNotificacao('Erro', `Erro ao adicionar produto: ${resultado.erro || "Erro desconhecido."}`, 'error');
    }
  } catch (err) {
    mostrarNotificacao('Erro', `Erro na requisição: ${err.message}`, 'error');
  }
}

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${year}-${month}-${day}`;
    
    document.getElementById('produto-fabricacao').max = todayFormatted;
    document.getElementById('produto-validade').min = todayFormatted;
    document.getElementById('editar-fabricacao').max = todayFormatted;
    document.getElementById('editar-validade').min = todayFormatted;
});

function validarFormularioAdicao() {
    const fabricacao = document.getElementById('produto-fabricacao').value;
    const validade = document.getElementById('produto-validade').value;
    const today = new Date().toISOString().split('T')[0];
    
    if (fabricacao && fabricacao > today) {
        alert("A data de fabricação não pode ser depois de hoje!");
        return false;
    }
    
    if (validade && validade < today) {
        alert("A data de validade não pode ser antes de hoje!");
        return false;
    }
    
    if (fabricacao && validade && fabricacao > validade) {
        alert("A data de fabricação não pode ser depois da data de validade!");
        return false;
    }
    
    return true;
}

async function confirmarEdicao() {
  const produtoAtualizado = {
    productId: parseInt(document.getElementById("codigo-editar").value),
    name: document.getElementById('editar-nome').value,
    barcode: document.getElementById('editar-barcode').value,
    price: parseFloat(document.getElementById('editar-preco').value),
    category: document.getElementById('editar-categoria').value,
    stock: parseInt(document.getElementById('editar-estoque').value),
    lot: document.getElementById('editar-lote').value,
    departament: document.getElementById('editar-departamento').value,
    marketId: document.getElementById('editar-marketId').value,
    manufactureDate: document.getElementById('editar-fabricacao').value,
    expirationDate: document.getElementById('editar-validade').value
  };

  try {
    const response = await fetch("/editarProduto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produtoAtualizado)
    });

    const resultado = await response.json();

    if (response.ok) {
      mostrarNotificacao('Sucesso', 'Produto editado com sucesso!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modalEditarProduto')).hide();
      carregarProdutos();
    } else {
      mostrarNotificacao('Erro', `Erro ao editar produto: ${resultado.erro || "Erro desconhecido."}`, 'error');
    }
  } catch (error) {
    mostrarNotificacao('Erro', `Erro ao tentar editar: ${error.message}`, 'error');
  }
}

async function excluirProduto() {
  const id = parseInt(document.getElementById("codigo-excluir").value);
  if (isNaN(id)) {
    mostrarNotificacao('Atenção', 'ID inválido.', 'warning');
    return;
  }

  try {
    const res = await fetch("/deletarProduto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: id })
    });

    const resultado = await res.json();

    if (res.ok) {
      mostrarNotificacao('Sucesso', 'Produto excluído com sucesso!', 'success');
      carregarProdutos();
      return true;
    } else {
      mostrarNotificacao('Erro', `Erro ao excluir produto: ${resultado.erro || "Erro desconhecido."}`, 'error');
    }
  } catch (err) {
    mostrarNotificacao('Erro', `Erro na requisição: ${err.message}`, 'error');
  }
}

// Inicializa ao carregar a página
carregarProdutos();

async function gerarCodigo() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  let codigo = '';
  
  for (let i = 0; i < 8; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      codigo += caracteres[indice];
  }
  
  fetch('/getMarketId', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo })
  })
    .then(res => res.json())
    .then(data => {
      if (data.mensagem != codigo) {
        return codigo;
      } else {
        console.log('ja existe este market id');
        gerarCodigo();
      }
    })
    .catch(err => console.error('Erro ao carregar produtos:', err));
}