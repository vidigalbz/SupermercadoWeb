// webpages/estoque/script.js

// Variáveis globais para este script e para serem acessadas por outros (como popups.js)
let marketIdGlobal;
let userIdGlobal;
window.currentData = []; // Lista de produtos carregados (global para popups.js poder ler)

// Elementos do DOM
const container = document.getElementById("produtos-container");
const filterCategoriaSelect = document.getElementById("filtro-categoria");
const filterDepartamentoSelect = document.getElementById("filtro-departamento");
const pesquisaInput = document.getElementById("pesquisa");
const supermarketNameEl = document.getElementById("supermarket-name");
const produtoMarketIdInputModal = document.getElementById("produto-marketId"); // Para modal de adicionar

// Função para pegar parâmetro da URL
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

// Debounce para pesquisa
let debounceTimerSearch;
function debounceSearch(func, delay) {
  clearTimeout(debounceTimerSearch);
  debounceTimerSearch = setTimeout(func, delay);
}

// Ao carregar o DOM
document.addEventListener('DOMContentLoaded', async function() {
  // Recupera IDs
  marketIdGlobal = getQueryParam('id');
  userIdGlobal = localStorage.getItem("userId");

  // Preenche campo oculto no modal de adicionar, se existir
  if (produtoMarketIdInputModal) {
    produtoMarketIdInputModal.value = marketIdGlobal;
  }

  // Validações iniciais
  if (!marketIdGlobal) {
    console.error("ESTOQUE SCRIPT: Market ID não encontrado na URL!");
    if (supermarketNameEl) supermarketNameEl.textContent = "Supermercado: ID NÃO ENCONTRADO NA URL";
    if (container) container.innerHTML = "<p class='alert alert-danger'>Erro crítico: ID do mercado não fornecido na URL.</p>";
    if (pesquisaInput) pesquisaInput.disabled = true;
    return;
  }
  if (!userIdGlobal) {
    console.error("ESTOQUE SCRIPT: User ID não encontrado no localStorage! Redirecionando para login.");
    alert("Sua sessão expirou ou você não está logado. Redirecionando para login.");
    window.location.href = "/login";
    return;
  }

  console.log(`ESTOQUE SCRIPT: Market ID = ${marketIdGlobal}, User ID = ${userIdGlobal}`);
  localStorage.setItem("marketId", marketIdGlobal);

  // Verifica supermercado e carrega dados
  await verificSuper(marketIdGlobal);
  await carregarSetoresEstoque(marketIdGlobal);
  await carregarProdutos(marketIdGlobal);

  // Listeners para filtros e pesquisa
  if (filterCategoriaSelect) {
    filterCategoriaSelect.addEventListener("change", () => {
      searchEstoque();
    });
  }
  if (filterDepartamentoSelect) {
    filterDepartamentoSelect.addEventListener("change", () => {
      searchEstoque();
    });
  }
  const btnPesquisar = document.getElementById("btn-pesquisar");
  if (btnPesquisar) {
    btnPesquisar.addEventListener("click", () => {
      searchEstoque();
    });
  }
  if (pesquisaInput) {
    pesquisaInput.addEventListener("input", () => {
      debounceSearch(searchEstoque, 500);
    });
    pesquisaInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        searchEstoque();
      }
    });
  }

  // Formulário de adicionar produto
  const addProductForm = document.getElementById("form-adicionar-item");
  if (addProductForm) {
    addProductForm.addEventListener("submit", function(event) {
      event.preventDefault();
      adicionarProduto();
    });
  }

  // Botão de recarregar estoque
  const reloadButton = document.getElementById("btn-recarrega-estoque");
  if (reloadButton) {
    reloadButton.addEventListener("click", () => carregarProdutos(marketIdGlobal));
  }
});

function reloadPage() {
  if (marketIdGlobal) {
    carregarProdutos(marketIdGlobal);
  } else {
    location.reload();
  }
}

async function verificSuper(currentMarketId) {
  if (!currentMarketId) {
    if (supermarketNameEl) supermarketNameEl.textContent = "Supermercado: ID Inválido";
    return;
  }
  try {
    const response = await fetch("/verific", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: currentMarketId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Falha ao verificar supermercado");

    if (data.success && data.market) {
      if (supermarketNameEl) supermarketNameEl.textContent = "Supermercado: " + data.market.name;
    } else {
      if (supermarketNameEl) supermarketNameEl.textContent = "Supermercado: Não Encontrado";
      console.warn("POPUP SCRIPT: verificSuper - " + (data.message || "Supermercado não encontrado"));
    }
  } catch (err) {
    console.error('ESTOQUE SCRIPT: Erro em verificSuper:', err);
    if (supermarketNameEl) supermarketNameEl.textContent = "Supermercado: Erro na Verificação";
  }
}

async function carregarSetoresEstoque(currentMarketId) {
  if (!currentMarketId) {
    console.error("ESTOQUE SCRIPT: marketId não fornecido para carregarSetoresEstoque");
    return;
  }
  try {
    const response = await fetch('/getSetor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: currentMarketId })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "Erro ao buscar setores");

    const popularSelectLocal = (selectEl, opcoes, textoPadrao = "Selecione...") => {
      if (!selectEl) return;
      selectEl.innerHTML = `<option value="">${textoPadrao}</option>`;
      if (opcoes && opcoes.length > 0) {
        opcoes.forEach(opt => {
          selectEl.innerHTML += `<option value="${opt}">${opt}</option>`;
        });
      }
    };
    popularSelectLocal(filterCategoriaSelect, data.cat, 'Todas Categorias');
    popularSelectLocal(filterDepartamentoSelect, data.dept, 'Todos Departamentos');
  } catch (error) {
    console.error('ESTOQUE SCRIPT: Erro ao carregar setores para filtros:', error);
    if (typeof showAlert === 'function') showAlert('Erro Filtros', 'Falha ao carregar categorias/departamentos para filtros.', 'error');
  }
}

async function getImageURL(rawImagePath) {
  if (!rawImagePath || typeof rawImagePath !== 'string' || rawImagePath.trim() === '') {
    return 'https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1';
  }
  if (rawImagePath.startsWith('http://') || rawImagePath.startsWith('https://')) {
    return rawImagePath;
  }
  try {
    const response = await fetch('/api/ip');
    const data = await response.json();
    const ip = data.ip || 'localhost';
    let finalPath = rawImagePath.replace(/\\/g, '/').replace(/^\\?/, '');
    return `http://${ip}:4000/${finalPath}`;
  } catch (error) {
    console.error("ESTOQUE SCRIPT: Erro ao obter IP para URL da imagem:", error);
    return `/${rawImagePath.replace(/\\/g, '/').replace(/^\\?/, '')}`;
  }
}

async function criarCardHTML(produto) {
  if (!produto || typeof produto.productId === 'undefined') return;
  const imagemURL = await getImageURL(produto.image);

  const productName = produto.name || "Nome Indisponível";
  const barcode = produto.barcode || "-";
  const productId = produto.productId;
  const price = typeof produto.price === 'number' ? produto.price.toFixed(2) : "-";
  const category = produto.category || "-";
  const stock = typeof produto.stock === 'number' ? produto.stock : "-";
  const lot = produto.lot || "-";
  const department = produto.departament || "-";
  const expirationDate = produto.expirationDate ? new Date(produto.expirationDate + 'T00:00:00').toLocaleDateString('pt-BR') : "-";
  const manufactureDate = produto.manufactureDate ? new Date(produto.manufactureDate + 'T00:00:00').toLocaleDateString('pt-BR') : "-";

  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4';

  cardWrapper.innerHTML = `
    <div class="card h-100 shadow-sm card-produto" data-id="${productId}">
      <div style="height: 180px; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: #f8f9fa; border-top-left-radius: calc(0.375rem - 1px); border-top-right-radius: calc(0.375rem - 1px);">
          <img src="${imagemURL}" class="card-img-top produto-imagem-card" alt="${productName}" 
               style="max-height: 100%; max-width: 100%; object-fit: contain;"
               onerror="this.onerror=null; this.src='https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1';">
      </div>
      <div class="card-body d-flex flex-column">
        <h5 class="card-title" title="${productName}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${productName}</h5>
        <p class="card-text mb-1 small"><strong>Cód. Barras:</strong> <span class="text-muted">${barcode}</span></p>
        <p class="card-text mb-1"><strong>Preço:</strong> R$ ${price}</p>
        <p class="card-text mb-2"><strong>Estoque:</strong> ${stock} unidades</p>
        <div class="mt-auto d-flex justify-content-start flex-wrap gap-1">
          <button type="button" class="btn btn-sm btn-outline-secondary btn-copiar" 
                  data-productid-copiar="${productId}" title="Copiar ID do Sistema (${productId})">
            <i class="bi bi-clipboard"></i> ID
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary btn-editar-card" 
                  data-productid-editar="${productId}" title="Editar Produto">
            <i class="bi bi-pencil-square"></i> Editar
          </button>
          <button type="button" class="btn btn-sm btn-outline-info btn-detalhes-card"
                  title="Mais Detalhes"
                  data-bs-toggle="popover" data-bs-html="true" data-bs-trigger="hover focus"
                  data-bs-content="
                    <strong>ID Sistema:</strong> ${productId}<br>
                    <strong>Categoria:</strong> ${category}<br>
                    <strong>Departamento:</strong> ${department}<br>
                    <strong>Lote:</strong> ${lot}<br>
                    <strong>Fabricação:</strong> ${manufactureDate}<br>
                    <strong>Validade:</strong> ${expirationDate}">
            <i class="bi bi-info-circle"></i> Detalhes
          </button>
           <button type="button" class="btn btn-sm btn-outline-danger btn-excluir-card"
                  data-productid-excluir="${productId}" title="Excluir Produto">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </div>
      </div>
    </div>`;

  if (container) container.appendChild(cardWrapper);

  // Botões do card
  const btnCopiar = cardWrapper.querySelector('.btn-copiar');
  if (btnCopiar) {
    new bootstrap.Tooltip(btnCopiar);
    btnCopiar.addEventListener('click', function() {
      const idParaCopiar = this.getAttribute('data-productid-copiar');
      navigator.clipboard.writeText(idParaCopiar).then(() => {
        const originalHTML = this.innerHTML;
        this.innerHTML = '<i class="bi bi-check-lg"></i> Copiado';
        setTimeout(() => { this.innerHTML = originalHTML; }, 2000);
        if (typeof showAlert === 'function') showAlert("ID Copiado!", `ID ${idParaCopiar} copiado.`, "success");
      }).catch(err => {
        console.error('Falha ao copiar ID:', err);
        if (typeof showAlert === 'function') showAlert("Falha ao Copiar", "Não foi possível copiar o ID.", "error");
      });
    });
  }

  const btnEditarCard = cardWrapper.querySelector('.btn-editar-card');
  if (btnEditarCard) {
    btnEditarCard.addEventListener('click', function() {
      const productIdParaEditar = this.getAttribute('data-productid-editar');
      const codigoEditarInput = document.getElementById('codigo-editar');
      if (codigoEditarInput) codigoEditarInput.value = productIdParaEditar;
      if (typeof abrirModalEdicao === 'function') {
        abrirModalEdicao();
      } else { console.error("Função abrirModalEdicao não encontrada."); }
    });
  }

  const btnExcluirCard = cardWrapper.querySelector('.btn-excluir-card');
  if (btnExcluirCard) {
    btnExcluirCard.addEventListener('click', function() {
      const productIdParaExcluir = this.getAttribute('data-productid-excluir');
      const codigoExcluirInput = document.getElementById('codigo-excluir');
      if (codigoExcluirInput) codigoExcluirInput.value = productIdParaExcluir;
      if (typeof abrirModalExclusao === 'function') {
        abrirModalExclusao();
      } else { console.error("Função abrirModalExclusao não encontrada."); }
    });
  }
  const btnDetalhesCard = cardWrapper.querySelector('.btn-detalhes-card');
  if (btnDetalhesCard) {
    new bootstrap.Popover(btnDetalhesCard);
  }
}

async function renderizarProdutos(produtos) {
  if (!container) { console.error("Container de produtos não existe no DOM."); return; }
  container.innerHTML = '';
  if (!produtos || produtos.length === 0) {
    container.innerHTML = "<p class='alert alert-info col-12'>Nenhum produto encontrado no estoque com os filtros atuais.</p>";
    window.currentData = [];
    if (typeof atualizarAlertas === 'function' && marketIdGlobal) {
      atualizarAlertas(marketIdGlobal);
    }
    return;
  }
  for (const produto of produtos) {
    await criarCardHTML(produto);
  }
  window.currentData = produtos;
  if (typeof atualizarAlertas === 'function' && marketIdGlobal) {
    atualizarAlertas(marketIdGlobal);
  }
}

async function carregarProdutos(currentMarketId) {
  if (!currentMarketId) {
    if (container) container.innerHTML = "<p class='alert alert-warning'>ID do mercado não definido.</p>";
    return;
  }
  if (container) container.innerHTML = "<div class='col-12 text-center p-3'><div class='spinner-border text-primary' role='status'><span class='visually-hidden'>Carregando...</span></div> <p>Carregando produtos...</p></div>";

  try {
    const response = await fetch('/estoqueData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: currentMarketId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || `HTTP error ${response.status}`);

    if (data.mensagem) {
      await renderizarProdutos(data.mensagem);
    } else {
      throw new Error(data.erro || "Formato de resposta inesperado do servidor ao carregar produtos.");
    }
  } catch (err) {
    console.error('ESTOQUE SCRIPT: Erro ao carregar produtos:', err);
    if (container) container.innerHTML = `<p class='alert alert-danger col-12'>Erro ao carregar produtos: ${err.message}</p>`;
    window.currentData = [];
    if (typeof atualizarAlertas === 'function' && currentMarketId) {
      atualizarAlertas(currentMarketId);
    }
  }
}

function searchEstoque() {
  const valorBusca = pesquisaInput ? pesquisaInput.value.trim() : "";
  const categoria = filterCategoriaSelect ? filterCategoriaSelect.value : "";
  const departamento = filterDepartamentoSelect ? filterDepartamentoSelect.value : "";

  if (!marketIdGlobal) {
    if (typeof showAlert === 'function') showAlert('Erro', 'ID do mercado não encontrado para a busca.', 'error');
    return;
  }
  if (container) container.innerHTML = "<div class='col-12 text-center p-3'><div class='spinner-border text-primary' role='status'><span class='visually-hidden'>Buscando...</span></div> <p>Buscando...</p></div>";

  const payload = {
    busca: valorBusca,
    marketId: marketIdGlobal,
  };
  if (categoria && categoria !== "Todos") payload.category = categoria;

  fetch('/estoqueData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.mensagem) {
        renderizarProdutos(data.mensagem);
      } else {
        throw new Error(data.erro || "Resposta da busca inválida.");
      }
    })
    .catch(err => {
      console.error('ESTOQUE SCRIPT: Erro na busca:', err);
      if (container) container.innerHTML = `<p class='alert alert-danger col-12'>Erro na busca: ${err.message}</p>`;
      window.currentData = [];
      if (typeof atualizarAlertas === 'function' && marketIdGlobal) {
        atualizarAlertas(marketIdGlobal);
      }
    });
}

async function adicionarProduto() {
  const userId = userIdGlobal;
  const currentMarketId = marketIdGlobal;

  if (!userId) {
    if (typeof showAlert === 'function') showAlert('Erro de Autenticação', 'ID do usuário não encontrado. Faça login novamente.', 'error');
    return false;
  }
  if (!currentMarketId) {
    if (typeof showAlert === 'function') showAlert('Erro de Contexto', 'ID do Mercado não identificado.', 'error');
    return false;
  }

  const form = document.getElementById("form-adicionar-item");
  if (!form) {
    console.error("Formulário de adicionar item não encontrado.");
    return false;
  }

  const nome = document.getElementById("produto-nome").value.trim();
  const codigo = document.getElementById("produto-barcode").value.trim();
  const precoStr = document.getElementById("add-preco").value;
  const categoria = document.getElementById("add-categoria").value;
  const estoqueStr = document.getElementById("produto-estoque").value;
  const departamento = document.getElementById("add-departamento").value;
  const fabricacao = document.getElementById("produto-fabricacao").value;
  const validade = document.getElementById("produto-validade").value;

  if (!nome || !codigo || !precoStr || !categoria || !estoqueStr || !departamento || !fabricacao || !validade) {
    if (typeof showAlert === 'function') showAlert('Atenção', 'Preencha todos os campos obrigatórios do produto.', 'warning');
    return false;
  }
  const preco = parseFloat(precoStr);
  const estoque = parseInt(estoqueStr);
  if (isNaN(preco) || isNaN(estoque)) {
    if (typeof showAlert === 'function') showAlert('Atenção', 'Preço e Estoque devem ser números válidos.', 'warning');
    return false;
  }

  const formData = new FormData(form);
  formData.append("userId", userId);
  formData.append("marketId", currentMarketId);

  try {
    const res = await fetch("/adicionarProduto", { method: "POST", body: formData });
    const resultado = await res.json();

    if (res.ok && resultado.mensagem && resultado.mensagem.includes("sucesso")) {
      if (typeof showAlert === 'function') showAlert('Sucesso', resultado.mensagem, 'success');
      form.reset();
      carregarProdutos(currentMarketId);
      return true;
    } else {
      throw new Error(resultado.erro || "Erro desconhecido ao adicionar produto.");
    }
  } catch (err) {
    if (typeof showAlert === 'function') showAlert('Erro Adição', err.message, 'error');
    return false;
  }
}

async function confirmarEdicao() {
  const userId = userIdGlobal;
  const productIdDoForm = document.getElementById("editar-productId")?.value;
  const marketIdDoFormulario = document.getElementById('editar-marketId')?.value.trim();

  if (!userId) {
    if (typeof showAlert === 'function') showAlert('Erro de Autenticação', 'Usuário não identificado. Faça login novamente.', 'error');
    else alert('Erro de Autenticação: Usuário não identificado.');
    return false;
  }
  if (!productIdDoForm) {
    if (typeof showAlert === 'function') showAlert('Erro de Interface', 'ID do produto para edição não encontrado (campo oculto).', 'error');
    else alert('Erro de Interface: ID do produto para edição não encontrado.');
    console.error("ESTOQUE SCRIPT: Não foi possível ler #editar-productId.value em confirmarEdicao.");
    return false;
  }
  if (!marketIdDoFormulario) {
    if (typeof showAlert === 'function') showAlert('Erro de Interface', 'ID do mercado do produto não encontrado no formulário de edição.', 'error');
    else alert('Erro de Interface: ID do mercado do produto não encontrado.');
    console.error("ESTOQUE SCRIPT: Não foi possível ler #editar-marketId.value em confirmarEdicao.");
    return false;
  }

  const nomeProduto = document.getElementById('editar-nome')?.value.trim();
  const precoProdutoStr = document.getElementById('editar-preco')?.value;
  const categoriaProduto = document.getElementById('editar-categoria')?.value;
  const estoqueProdutoStr = document.getElementById('editar-estoque')?.value;
  const departamentoProduto = document.getElementById('editar-departamento')?.value;
  const barcodeProduto = document.getElementById('editar-barcode')?.value.trim();
  const loteProduto = document.getElementById('editar-lote')?.value.trim();
  const fabricacaoProduto = document.getElementById('editar-fabricacao')?.value;
  const validadeProduto = document.getElementById('editar-validade')?.value;

  const produtoAtualizado = {
    userId: parseInt(userId),
    productId: parseInt(productIdDoForm),
    name: nomeProduto,
    price: parseFloat(precoProdutoStr),
    category: categoriaProduto,
    stock: parseInt(estoqueProdutoStr),
    departament: departamentoProduto,
    marketId: marketIdDoFormulario,
    barcode: barcodeProduto,
    lot: loteProduto,
    manufactureDate: fabricacaoProduto,
    expirationDate: validadeProduto
  };

  if (!produtoAtualizado.name || isNaN(produtoAtualizado.price) || !produtoAtualizado.category || 
      isNaN(produtoAtualizado.stock) || !produtoAtualizado.departament || !produtoAtualizado.barcode ||
      !produtoAtualizado.lot || !produtoAtualizado.manufactureDate || !produtoAtualizado.expirationDate ) {
    let camposFaltantes = [];
    if (!produtoAtualizado.name) camposFaltantes.push("Nome");
    if (isNaN(produtoAtualizado.price)) camposFaltantes.push("Preço");

    const mensagemErro = `Campos obrigatórios da edição estão vazios ou inválidos. Verifique: ${camposFaltantes.join(', ') || 'todos os campos'}.`;
    if (typeof showAlert === 'function') showAlert('Campos Inválidos', mensagemErro, 'warning');
    else alert(mensagemErro);
    return false;
  }
  if (isNaN(produtoAtualizado.productId)) {
    if (typeof showAlert === 'function') showAlert('Erro', 'ID do Produto inválido para edição.', 'error');
    else alert('ID do Produto inválido para edição.');
    return false;
  }

  try {
    console.log("ESTOQUE SCRIPT: Enviando para /editarProduto:", produtoAtualizado);
    const response = await fetch("/editarProduto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produtoAtualizado)
    });
    const resultado = await response.json();

    if (response.ok && resultado.success) {
      if (typeof showAlert === 'function') showAlert('Sucesso', resultado.message || 'Produto editado com sucesso!', 'success');
      else alert('Produto editado com sucesso!');
      if (marketIdGlobal) {
        await carregarProdutos(marketIdGlobal);
      }
      return true;
    } else {
      throw new Error(resultado.message || resultado.erro || "Erro desconhecido ao editar produto.");
    }
  } catch (error) {
    console.error("ESTOQUE SCRIPT: Erro ao confirmar edição:", error);
    if (typeof showAlert === 'function') showAlert('Erro na Edição', error.message, 'error');
    else alert(`Erro na Edição: ${error.message}`);
    return false;
  }
}

async function excluirProduto() {
  const productIdParaExcluir = parseInt(document.getElementById("codigo-excluir")?.value.trim());
  const userId = userIdGlobal;
  const currentMarketId = marketIdGlobal;

  if (isNaN(productIdParaExcluir)) {
    if (typeof showAlert === 'function') showAlert('Atenção', 'Código do produto para exclusão é inválido.', 'warning');
    return false;
  }
  if (!userId || !currentMarketId) {
    if (typeof showAlert === 'function') showAlert('Erro de Contexto', 'Usuário ou ID do Mercado não identificado para exclusão.', 'error');
    return false;
  }

  try {
    const res = await fetch("/deletarProduto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        productId: productIdParaExcluir, 
        userId: parseInt(userId), 
        marketId: currentMarketId 
      })
    });
    const resultado = await res.json();

    if (res.ok && resultado.mensagem && resultado.mensagem.includes("sucesso")) {
      if (typeof showAlert === 'function') showAlert('Sucesso', resultado.mensagem, 'success');
      carregarProdutos(currentMarketId);
      return true;
    } else {
      throw new Error(resultado.erro || "Erro desconhecido ao excluir produto.");
    }
  } catch (err) {
    if (typeof showAlert === 'function') showAlert('Erro Exclusão', err.message, 'error');
    return false;
  }
}
