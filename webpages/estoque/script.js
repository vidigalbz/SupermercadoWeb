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
const precoInput = document.getElementById("add-preco");
const estoqueInput = document.getElementById("produto-estoque");
const valorTotalInput = document.getElementById("valor-total-compra");

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

async function verificarUser() {
  try {
    if (!userIdGlobal) {
          window.location.href = "/error403";
          return;
    }''
    const res = await fetch('/api/usuarios/users/' + userIdGlobal);
    const data = await res.json();

    console.log(data);

    const funcionarios =  await fetch('/api/funcionarios/funcionarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketIdGlobal })
    });

    // TODO: 
    // O Fetch não está sendo fechado

    console.log("a");

    let funcData = await funcionarios.json();
    funcionariosData = funcData.message;

    if (data.data.gestor){
      return;
    }
    if (!data.data) {
      window.location.href = "/error403";
    }
  } catch (err) {
    console.error("Erro ao verificar usuário:", err);
   // window.location.href = "/error404";
  }
}

// Ao carregar o DOM
document.addEventListener('DOMContentLoaded', async function() {
  // Recupera IDs
  marketIdGlobal = getCookie('marketId');
  userIdGlobal = getCookie("user");

  verificarUser();

  // Preenche campo oculto no modal de adicionar, se existir
  produtoMarketIdInputModal.value = marketIdGlobal;

  // Validações iniciais
  if (!marketIdGlobal) {
    console.error("ESTOQUE SCRIPT: Market ID não encontrado na URL!");
    if (supermarketNameEl) supermarketNameEl.textContent = "Supermercado: ID NÃO ENCONTRADO NA URL";
    if (container) container.innerHTML = "<p class='alert alert-danger'>Erro crítico: ID do mercado não fornecido na URL.</p>";
    if (pesquisaInput) pesquisaInput.disabled = true;
    window.location.href = '/error404'
    return;
  }
  if (!userIdGlobal) {
    window.location.href = "/error403";
    return;
  }

  console.log(`ESTOQUE SCRIPT: Market ID = ${marketIdGlobal}, User ID = ${userIdGlobal}`);

  // Verifica supermercado e carrega dados
  await verificSuper();
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

function verificSuper(){
    fetch("/api/supermercados/verify", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({busca: marketIdGlobal, column: "marketId", tableSelect :"supermarkets"})
    }).then( res => res.json())
    .then( data => {
      if (Object.keys(data.mensagem).length == 0){
        window.location.href = '/Error404'
      } else {

        const supermarketName = data.mensagem[0].name;
        document.getElementById("supermarket-name").textContent = "Super Mercado: " + supermarketName;
      }
    })
    .catch(err => console.error('Erro ao verificar supermercado:', err));
}

async function carregarSetoresEstoque(currentMarketId) {
  obterNomeFornecedor();
  if (!currentMarketId) {
    console.error("ESTOQUE SCRIPT: marketId não fornecido para carregarSetoresEstoque");
    return;
  }
  try {
    const response = await fetch('/api/setores/getSetor', {
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

  console.log("CRIAR CARD HTML (Botões Editar/Excluir Removidos do Card) - Recebendo produto:", JSON.stringify(produto, null, 2));
  if (!produto || typeof produto.productId === 'undefined' || produto.productId === null) {
    console.warn("CRIAR CARD HTML: productId inválido ou ausente. Produto:", produto, "O card não será renderizado.");
    return;
  }

  const imagemURL = await getImageURL(produto.image); // Sua função getImageURL

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
  const supplier = produto.supplier || "-";
  const pricePerUnity = typeof produto.price_per_unity === 'number' ? produto.price_per_unity.toFixed(2) : "-";

  const tempDiv = document.createElement('div');


  tempDiv.innerHTML = `
    <div class="card-produto d-flex mb-3" data-id="${productId}" style="border-radius: 10px; overflow: hidden; border: 1px solid #ccc; background-color: #fff;">
      <div class="imagem-produto" style="background-image: url('${imagemURL}'); width: 120px; height: 150px; background-size: cover; background-position: center; border-top-left-radius: 9px; border-bottom-left-radius: 9px;">
        <img src="${imagemURL}" style="display:none;" onerror="this.parentElement.style.backgroundImage='url(https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1)'; this.style.display='none';"/>
      </div>
      <div class="info-produto p-2 text-white d-flex flex-column justify-content-between" style="background-color: #007bff; flex: 1; font-size: 0.85rem;">
        <div>
            <h6 class="card-title text-white" title="${productName}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.95rem;">${productName}</h6>
            <p class="card-text mb-1 small"><strong>Cód. Barras:</strong> ${barcode}</p>
            <p class="card-text mb-1 small"><strong>Preço:</strong> R$ ${price}</p>
            <p class="card-text small"><strong>Estoque:</strong> ${stock} unid.</p>
        </div>
        <div class="mt-2 d-flex justify-content-start flex-wrap gap-1">
          <button type="button" class="btn btn-light btn-sm btn-copiar"
                  data-productid-copiar="${productId}" 
                  data-bs-toggle="tooltip" data-bs-placement="top"
                  title="Copiar ID Sistema (${productId})">
            <i class="bi bi-clipboard"></i> ID
          </button>
          <button type="button" class="btn btn-light btn-sm btn-detalhes-card" 
                  data-bs-toggle="popover" data-bs-html="true" data-bs-trigger="hover focus"
                  title="Detalhes do Produto"
                  data-bs-content="
                    <strong>Nome:</strong> ${productName}<br>
                    <strong>Cód. Barras:</strong> ${barcode}<br>
                    <strong>ID Sistema:</strong> ${productId}<br>
                    <strong>Fornecedor:</strong> ${nomeFornecedor}<br>
                    <strong>Preço por unidade:</strong> R$ ${produto.price_per_unity}<br>
                    <strong>Preço Total:</strong> R$ ${price}<br>
                    <strong>Categoria:</strong> ${category}<br>
                    <strong>Estoque:</strong> ${stock} unidades<br>
                    <strong>Lote:</strong> ${lot}<br>
                    <strong>Departamento:</strong> ${department}<br>
                    <strong>Validade:</strong> ${expirationDate}<br>
                    <strong>Fabricação:</strong> ${manufactureDate}">
            <i class="bi bi-info-circle"></i> Detalhes
          </button>
          <button type="button" class="btn btn-light btn-sm btn-codigoBar"
                  data-barcode-imprimir="${barcode}" title="Imprimir Código de Barras" 
                  onclick="typeof impressao === 'function' ? impressao('${barcode}') : console.warn('Função impressao() não definida.')">
            <i class="bi bi-upc"></i> Barras
          </button>
          </div>
      </div>
    </div>
  `;
  
  const cardElement = tempDiv.firstElementChild; 
  if (container && cardElement) {
      container.appendChild(cardElement);

      // Adiciona listener APENAS para o botão de copiar DESTE card
      const btnCopiar = cardElement.querySelector('.btn-copiar');
      if (btnCopiar) {
          new bootstrap.Tooltip(btnCopiar);
          btnCopiar.addEventListener('click', function() {
              const idParaCopiar = this.getAttribute('data-productid-copiar');
              if (idParaCopiar && idParaCopiar !== "null" && idParaCopiar !== "undefined") {
                navigator.clipboard.writeText(idParaCopiar).then(() => {
                    const originalHTML = '<i class="bi bi-clipboard"></i> ID';
                    this.innerHTML = '<i class="bi bi-check-lg"></i> Copiado';
                    const tooltipInstance = bootstrap.Tooltip.getInstance(this);
                    if (tooltipInstance) { 
                        tooltipInstance.setContent({ '.tooltip-inner': 'ID Copiado!' });
                        tooltipInstance.show(); 
                    } else { new bootstrap.Tooltip(this, {title: 'ID Copiado!'}).show(); }

                    setTimeout(() => {
                        this.innerHTML = originalHTML;
                        if (tooltipInstance) tooltipInstance.setContent({ '.tooltip-inner': `Copiar ID Sistema (${idParaCopiar})` });
                    }, 2000);
                    if(typeof showAlert === 'function') showAlert("ID Copiado!", `ID ${idParaCopiar} copiado.`, "success");
                    else console.log("ID Copiado!", `ID ${idParaCopiar} copiado.`);
                }).catch(err => {
                    console.error('Falha ao copiar ID:', err);
                    if(typeof showAlert === 'function') showAlert("Falha ao Copiar", "Não foi possível copiar o ID.", "error");
                    else console.error("Falha ao copiar ID, showAlert não definida.");
                });
              } else {
                  console.error('ID para copiar é inválido:', idParaCopiar);
                  if(typeof showAlert === 'function') showAlert("Erro ao Copiar", "ID do produto inválido para cópia.", "error");
                  else console.error("Erro ao copiar: ID do produto inválido.");
              }
          });
      }

      // Listener para o botão de Detalhes (Popover)
      const btnDetalhesCard = cardElement.querySelector('.btn-detalhes-card');
      if (btnDetalhesCard) {
          new bootstrap.Popover(btnDetalhesCard, { trigger: 'hover focus' });
      }
      
      // Listener para o botão de Código de Barras
      const btnCodigoBar = cardElement.querySelector('.btn-codigoBar');
      if (btnCodigoBar) {
          new bootstrap.Tooltip(btnCodigoBar);
          // O onclick já está no HTML.
      }

  } else {
      console.error("ESTOQUE SCRIPT: Container de produtos (variável 'container') não encontrado para adicionar card ou cardElement não foi criado.");
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
    const response = await fetch('/api/produtos/estoqueData', {
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

  fetch('/api/produtos/estoqueData', {
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

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length);
    }
  }
  return "";
}

async function adicionarProduto() {
  console.log("ESTOQUE SCRIPT: Função adicionarProduto() chamada.");

  // Usando as variáveis globais definidas no DOMContentLoaded
  const currentUserId = userIdGlobal;
  const currentMarketId = marketIdGlobal;

  if (!currentUserId) {
      if (typeof showAlert === 'function') showAlert('Erro de Autenticação', 'ID do usuário não encontrado. Faça login novamente.', 'error');
      else alert('Erro de Autenticação: ID do usuário não encontrado.');
      return false; // Indica falha
  }
  if (!currentMarketId) {
      if (typeof showAlert === 'function') showAlert('Erro de Contexto', 'ID do Mercado não identificado. Recarregue a página.', 'error');
      else alert('Erro de Contexto: ID do Mercado não identificado.');
      return false; // Indica falha
  }

  const form = document.getElementById("form-adicionar-item");
  if (!form) {
      console.error("ESTOQUE SCRIPT: Formulário #form-adicionar-item não encontrado.");
      if (typeof showAlert === 'function') showAlert('Erro Interno', 'Formulário de adição não encontrado no HTML.', 'error');
      return false;
  }

  // Coleta de dados do formulário
  const nome = document.getElementById("produto-nome")?.value.trim();
  const codigo = document.getElementById("produto-barcode")?.value.trim(); // Este é o 'barcode'
  const precoStr = document.getElementById("add-preco")?.value;
  const categoria = document.getElementById("add-categoria")?.value;
  const estoqueStr = document.getElementById("produto-estoque")?.value;
  const lote = document.getElementById("produto-lote")?.value.trim();
  const departamento = document.getElementById("add-departamento")?.value;
  // marketId já temos em currentMarketId
  const fabricacao = document.getElementById("produto-fabricacao")?.value;
  const validade = document.getElementById("produto-validade")?.value;
  const imagemInput = document.getElementById("produto-imagem");

  // Validação Frontend COMPLETA (para corresponder à validação do backend)
  // O backend /adicionarProduto espera: nome, codigo, preco, categoria, estoque, lote, departamento, marketId, fabricacao, validade, userId
  if (!nome || !codigo || !precoStr || !categoria || !estoqueStr || !lote || !departamento || !fabricacao || !validade) {
      let camposFaltantesArray = [];
      if (!nome) camposFaltantesArray.push("Nome");
      if (!codigo) camposFaltantesArray.push("Código de Barras");
      if (!precoStr) camposFaltantesArray.push("Preço");
      if (!categoria) camposFaltantesArray.push("Categoria (selecione uma opção)");
      if (!estoqueStr) camposFaltantesArray.push("Estoque");
      if (!lote) camposFaltantesArray.push("Lote");
      if (!departamento) camposFaltantesArray.push("Departamento (selecione uma opção)");
      if (!fabricacao) camposFaltantesArray.push("Data de Fabricação");
      if (!validade) camposFaltantesArray.push("Data de Validade");
      
      const msgErro = "Campos obrigatórios estão ausentes: " + camposFaltantesArray.join(', ') + ".";
      if (typeof showAlert === 'function') showAlert('Atenção', msgErro, 'warning');
      else alert(msgErro);
      return false;
  }

  const preco = parseFloat(precoStr);
  const estoque = parseInt(estoqueStr);

  if (isNaN(preco) || preco <= 0) {
      if (typeof showAlert === 'function') showAlert('Atenção', 'Preço deve ser um número válido e maior que zero.', 'warning');
      else alert('Preço deve ser um número válido e maior que zero.');
      return false;
  }
  if (isNaN(estoque) || estoque < 0) { // Estoque pode ser 0
      if (typeof showAlert === 'function') showAlert('Atenção', 'Estoque deve ser um número válido (0 ou mais).', 'warning');
      else alert('Estoque deve ser um número válido (0 ou mais).');
      return false;
  }
  if (fabricacao && validade && new Date(fabricacao) > new Date(validade)) {
      if(typeof showAlert === 'function') showAlert('Data Inválida', 'A data de fabricação não pode ser posterior à data de validade!', 'warning');
      else alert('A data de fabricação não pode ser posterior à data de validade!');
      return false;
  }

  // Monta o FormData para enviar (incluindo o arquivo de imagem)
  const formData = new FormData();
  formData.append("userId", currentUserId);       // userId é obrigatório para o histórico no backend
  formData.append("marketId", currentMarketId);   // marketId é obrigatório
  formData.append("nome", nome);
  formData.append("codigo", codigo);              // 'codigo' no backend é o barcode
  formData.append("preco", preco.toString());
  formData.append("categoria", categoria);
  formData.append("estoque", estoque.toString());
  formData.append("lote", lote);
  formData.append("departamento", departamento);
  formData.append("fabricacao", fabricacao);
  formData.append("validade", validade);

  if (imagemInput && imagemInput.files.length > 0) {
      formData.append("imagem", imagemInput.files[0]);
  } else {
      formData.append("imagem", ""); // Envia string vazia se não houver imagem (backend deve tratar)
  }

  console.log("ESTOQUE SCRIPT: Enviando para /adicionarProduto (FormData):");
  for (let pair of formData.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
  }

  try {
      const res = await fetch("/api/produtos/adicionarProduto", {
          method: "POST",
          body: formData // Com FormData, o browser define o Content-Type automaticamente para multipart/form-data
      });

      const resultado = await res.json(); // Tenta parsear a resposta como JSON

      if (res.ok && resultado.mensagem && resultado.mensagem.includes("sucesso")) {
          if (typeof showAlert === 'function') showAlert('Sucesso!', resultado.mensagem, 'success');
          else alert(resultado.mensagem);
          
          form.reset(); // Limpa os campos do formulário
          // O modal será escondido pela função em popups.js que chamou esta.
          
          await carregarProdutos(currentMarketId); // Recarrega a lista de produtos para mostrar o novo
          return true; // Indica sucesso
      } else {
          // Usa a mensagem de erro do backend ou uma padrão
          throw new Error(resultado.erro || resultado.message || "Erro desconhecido do servidor ao adicionar produto.");
      }
  } catch (err) {
      console.error("ESTOQUE SCRIPT: Erro na função adicionarProduto:", err);
      if (typeof showAlert === 'function') showAlert('Erro ao Adicionar Produto', err.message, 'error');
      else alert(`Erro ao Adicionar Produto: ${err.message}`);
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
  calcularValorTotalEdicao();

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
    const response = await fetch("/api/produtos/editarProduto", {
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
    const res = await fetch("/api/produtos/deletarProduto", {
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



function calcularTotalCompra() {
  const precounidade = parseFloat(document.getElementById("add-unidade").value);
  const estoque = parseInt(document.getElementById("produto-estoque").value);
  const preco = precounidade * estoque;
 
  valorTotalInput.value = preco.toFixed(2);
}
 
function calcularValorTotalEdicao() {
  const precoUnidade = parseFloat(document.getElementById('editar-preço-unidade').value) || 0;
  const estoque = parseInt(document.getElementById('editar-estoque').value) || 0;
  const total = precoUnidade * estoque;
 
  document.getElementById('editar-valor-total').value = total.toFixed(2).replace('.', ',');
}
 
function abrirFornecedores(){
  var url = window.location.origin
  window.location.href = `${url}/fornecedores/?id=${id}`
}

async function obterNomeFornecedor(cnpj) {
  try {
    const response = await fetch('/api/fornecedores/fornecedorData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (!response.ok) throw new Error('Erro na requisição');
    const data = await response.json();
    const fornecedores = data.result || [];
    
    const fornecedor = fornecedores.find(f => String(f.cnpj) === String(cnpj));
    return fornecedor ? fornecedor.razao_social : cnpj;
  } catch (error) {
    console.error('Erro ao buscar nome do fornecedor:', error);
    return cnpj;
  }
}

 
// Atualiza o valor total sempre que o preço ou o estoque mudar
precoInput.addEventListener("input", calcularTotalCompra);
estoqueInput.addEventListener("input", calcularTotalCompra);