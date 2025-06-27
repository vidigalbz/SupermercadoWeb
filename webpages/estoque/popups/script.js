
let categoriasGlobais = [];
let departamentosGlobais = [];
let tipoAtualSetor = "Departamento";

function showAlert(message, title = 'Aviso', type = 'info') {
  let container = document.querySelector('.toast-wrapper');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-wrapper';
    document.body.appendChild(container);
  }
  const toastEl = document.createElement('div');
  toastEl.className = `toast show`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  const tiposAlert = {
    success: { bg: 'bg-success', text: 'text-white', icon: '✔️' },
    error: { bg: 'bg-danger', text: 'text-white', icon: '❌' },
    warning: { bg: 'bg-warning', text: 'text-dark', icon: '⚠️' },
    info: { bg: 'bg-info', text: 'text-dark', icon: 'ℹ️' }
  };
  const config = tiposAlert[type] || tiposAlert.info;

  toastEl.classList.add(config.bg, config.text);

  toastEl.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">${config.icon} ${title}</strong>
      <small class="text-muted">Agora</small>
      <button type="button" class="btn-close ${config.text === 'text-white' ? 'btn-close-white' : ''}" data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  container.insertBefore(toastEl, container.firstChild);
  const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
    if (container.children.length === 0) { container.remove(); }
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

function getMarketIdParaPopups() {
  const id = getCookie("marketId");

  return id;
}
function getUserIdParaPopups() {
  const uid = getCookie("user");

  return uid;
}

async function carregarSetoresGlobais(currentMarketId) {
  if (!currentMarketId) {
    console.warn("POPUP SCRIPT: carregarSetoresGlobais chamado sem marketId. Setores não serão carregados.");
    categoriasGlobais = [];
    departamentosGlobais = [];
    preencherCombosAdicao();
    preencherCombosEdicao();
    preencherComboExcluirSetor();
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

    categoriasGlobais = data.cat || [];
    departamentosGlobais = data.dept || [];
  } catch (err) {
    categoriasGlobais = []; departamentosGlobais = [];
    showAlert(`Erro ao carregar Categoria/Departamento: ${err.message}`, "Erro de Dados", "error");
  }
  preencherCombosAdicao();
  preencherCombosEdicao();
  preencherComboExcluirSetor();
}

function preencherCombosAdicao() {
  const selectCategoria = document.getElementById("add-categoria");
  const selectDepartamento = document.getElementById("add-departamento");
  if (!selectCategoria || !selectDepartamento) return;

  selectCategoria.innerHTML = '<option value="">Selecione Categoria</option>';
  (categoriasGlobais || []).forEach(cat => {
    selectCategoria.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
  selectDepartamento.innerHTML = '<option value="">Selecione Departamento</option>';
  (departamentosGlobais || []).forEach(dep => {
    selectDepartamento.innerHTML += `<option value="${dep}">${dep}</option>`;
  });
}

function preencherCombosEdicao() {
  const selectCategoria = document.getElementById("editar-categoria");
  const selectDepartamento = document.getElementById("editar-departamento");
  if (!selectCategoria || !selectDepartamento) return;

  selectCategoria.innerHTML = '<option value="">Selecione Categoria</option>';
  (categoriasGlobais || []).forEach(cat => {
    selectCategoria.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
  selectDepartamento.innerHTML = '<option value="">Selecione Departamento</option>';
  (departamentosGlobais || []).forEach(dep => {
    selectDepartamento.innerHTML += `<option value="${dep}">${dep}</option>`;
  });
}

function abrirModalAdicionarItem() {
  const currentMarketId = getMarketIdParaPopups();
  if (!currentMarketId) {
    showAlert("ID do Mercado não identificado.", "Erro", "error");
    return;
  }

  carregarSetoresGlobais(currentMarketId).then(() => {


    const modalEl = document.getElementById('modalAdicionarItem');
    if (!modalEl) { return; }
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();


    const btnConfirmar = document.getElementById('btn-confirmar-adicionar');
    if (btnConfirmar) {
      const novoBtn = btnConfirmar.cloneNode(true);
      btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);
      novoBtn.onclick = async () => {
        if (typeof adicionarProduto === 'function') {
          const sucesso = await adicionarProduto();
          if (sucesso) modal.hide();
        }
      };
    }
  });
}

function abrirModalEditarProduto() {
  const currentMarketId = getMarketIdParaPopups();
  const productIdParaEditar = document.getElementById("codigo-editar")?.value.trim();

  if (!currentMarketId || !productIdParaEditar) {
    showAlert(!currentMarketId ? "ID do Mercado não identificado." : "Digite o código do produto para editar.", "Atenção", "warning");
    return;
  }

  if (typeof window.currentData === 'undefined' || !Array.isArray(window.currentData)) {
    showAlert("Lista de produtos não disponível. Recarregue a página.", "Erro de Dados", "error");
    return;
  }
  const produto = window.currentData.find(p => String(p.productId) === String(productIdParaEditar));

  if (!produto) {
    showAlert(`Produto com código "${productIdParaEditar}" não encontrado.`, "Não Encontrado", "error");
    return;
  }

  carregarSetoresGlobais(currentMarketId).then(() => {

    const elProductIdHidden = document.getElementById('codigo-editar');
    if (elProductIdHidden) {
      elProductIdHidden.value = produto.productId;
    } else {
      showAlert("Erro de interface: campo ID do produto ausente no formulário.", "Erro", "error");
      return;
    }

    const camposParaPreencher = {
      'editar-nome': produto.name || '',
      'editar-barcode': produto.barcode || '',
      'editar-preco': produto.price != null ? produto.price : '',
      'editar-preço-unidade': produto.priceUnit != null ? produto.priceUnit : "",
      'editar-categoria': produto.category || '',
      'editar-estoque': produto.stock != null ? produto.stock : '',
      'editar-lote': produto.lot || '',
      'editar-departamento': produto.departament || '',
      'editar-marketId': produto.marketId || currentMarketId,
      'editar-fabricacao': produto.manufactureDate ? produto.manufactureDate.split('T')[0] : '',
      'editar-validade': produto.expirationDate ? produto.expirationDate.split('T')[0] : ''
    };
    let todosCamposEncontrados = true;
    for (const idCampo in camposParaPreencher) {
      const elemento = document.getElementById(idCampo);
      if (elemento) {
        elemento.value = camposParaPreencher[idCampo];
        if (['editar-barcode', 'editar-lote', 'editar-marketId', 'editar-fabricacao', 'editar-validade'].includes(idCampo)) {
          elemento.disabled = true;
        } else {
          elemento.disabled = false;
        }
      } else {
        todosCamposEncontrados = false;
      }
    }
    if (!todosCamposEncontrados) {
      showAlert("Erro ao preparar formulário de edição. Verifique o console.", "Erro", "error");
      return;
    }
    const elImagem = document.getElementById('editar-imagem');
    if (elImagem) elImagem.value = '';

    const modalEl = document.getElementById('modalEditarProduto');
    if (!modalEl) { return; }
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  });
}

function abrirModalDepCat() {
  const currentMarketId = getMarketIdParaPopups();
  if (!currentMarketId) {
    showAlert("Nenhum mercado selecionado para gerenciar setores.", "Atenção", "warning");
    return;
  }
  carregarSetoresGlobais(currentMarketId).then(() => {
    const toggleTipoEl = document.getElementById("toggleTipo");
    if (toggleTipoEl) toggleTipoEl.checked = false;
    tipoAtualSetor = "Departamento";
    atualizarLabelTipoSetor();
    preencherComboExcluirSetor();

    const modalEl = document.getElementById("modal-dep-cat");
    if (!modalEl) { return; }
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  });
}

function alternarTipoSetor() {
  const toggleTipoEl = document.getElementById("toggleTipo");
  tipoAtualSetor = toggleTipoEl && toggleTipoEl.checked ? "Categoria" : "Departamento";
  atualizarLabelTipoSetor();
  preencherComboExcluirSetor();
}

function atualizarLabelTipoSetor() {
  const labelAddEl = document.getElementById("label-add");
  const labelSelectEl = document.getElementById("label-select");
  if (labelAddEl) labelAddEl.textContent = `Nova ${tipoAtualSetor}`;
  if (labelSelectEl) labelSelectEl.textContent = tipoAtualSetor;
}

function preencherComboExcluirSetor() {
  const select = document.getElementById("select-del");
  if (!select) return;
  select.innerHTML = '<option value="">Selecione para excluir</option>';
  const lista = tipoAtualSetor === "Departamento" ? (departamentosGlobais || []) : (categoriasGlobais || []);
  if (lista.length > 0) {
    lista.forEach(item => {
      select.innerHTML += `<option value="${item}">${item}</option>`;
    });
  }
}

async function adicionarDepartamentoCategoria() {
  const valorInput = document.getElementById("input-novo");
  if (!valorInput) { return; }
  const valor = valorInput.value.trim();

  if (!valor) {
    showAlert("Informe um nome para o novo setor.", "Campo obrigatório", "warning");
    return;
  }
  const tipoParaApi = tipoAtualSetor === "Departamento" ? "dept" : "cat";
  const currentMarketId = getMarketIdParaPopups();
  const currentUserId = getUserIdParaPopups();


  if (!currentMarketId || !currentUserId) {
    showAlert("ID do Mercado ou Usuário não identificado.", "Erro", "error");
    return;
  }
  try {
    const response = await fetch('/api/setores/addSetor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: valor, type: tipoParaApi, marketId: currentMarketId, userId: currentUserId })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "Erro ao adicionar setor.");

    showAlert(data.message || "Setor adicionado!", "Sucesso", "success");
    valorInput.value = "";
    await carregarSetoresGlobais(currentMarketId);

    if (typeof carregarSetoresEstoque === 'function') {
      carregarSetoresEstoque(currentMarketId);
    }
  } catch (err) {
    showAlert(err.message || "Erro desconhecido.", "Erro", "error");
  }
}

async function excluirDepartamentoCategoria() {
  const selectDelEl = document.getElementById("select-del");
  if (!selectDelEl) { return; }
  const valor = selectDelEl.value;

  if (!valor) {
    showAlert("Selecione um item para excluir.", "Aviso", "warning");
    return;
  }
  const tipoParaApi = tipoAtualSetor === "Departamento" ? "dept" : "cat";
  const currentMarketId = getMarketIdParaPopups();
  const currentUserId = getUserIdParaPopups();

  if (!currentMarketId || !currentUserId) {
    showAlert("ID do Mercado ou Usuário não identificado.", "Erro", "error");
    return;
  }
  try {
    const response = await fetch('/api/setores/deleteSetor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: valor, type: tipoParaApi, marketId: currentMarketId, userId: currentUserId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Erro ao excluir setor.");

    showAlert(data.mensagem || "Setor excluído!", "Sucesso", "success");
    await carregarSetoresGlobais(currentMarketId);
    if (typeof carregarSetoresEstoque === 'function') {
      carregarSetoresEstoque(currentMarketId);
    }
  } catch (err) {
    showAlert(err.message || "Erro desconhecido.", "Erro", "error");
  }
}

async function atualizarAlertas(currentMarketId) {
  const reloadBtn = document.getElementById('btn-reload-alerts');
  const reloadIcon = reloadBtn ? reloadBtn.querySelector('i') : null;
  const alertasUnidadesEl = document.getElementById('alertas-unidades');
  const alertasValidadeEl = document.getElementById('alertas-validade');
  const qtdAlertasEl = document.getElementById('quantidade-alertas');

  if (!alertasUnidadesEl || !alertasValidadeEl || !qtdAlertasEl) {
    return;
  }
  if (!currentMarketId) {
    console.warn("POPUP SCRIPT: atualizarAlertas chamado sem marketId.");
    alertasUnidadesEl.innerHTML = '<p class="text-muted p-2">ID do mercado não fornecido.</p>';
    alertasValidadeEl.innerHTML = '<p class="text-muted p-2">ID do mercado não fornecido.</p>';
    qtdAlertasEl.textContent = '0';
    return;
  }
  try {
    if (reloadIcon) reloadIcon.classList.add('spinner-icon');
    const response = await fetch('/api/produtos/estoqueData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: currentMarketId })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ erro: "Erro de rede" }));
      throw new Error(errData.erro || `Erro HTTP ${response.status} ao buscar dados para alertas.`);
    }
    const data = await response.json();
    const produtos = data.mensagem || [];

    const alertasEstoque = {
      vermelho: produtos.filter(p => p.stock < LIMITES_ESTOQUE.critico),
      laranja: produtos.filter(p => p.stock >= LIMITES_ESTOQUE.critico && p.stock < LIMITES_ESTOQUE.medio),
      amarelo: produtos.filter(p => p.stock >= LIMITES_ESTOQUE.medio && p.stock < LIMITES_ESTOQUE.semnecessidade)
    };
    const alertasValidade = {
      vermelho: produtos.filter(p => diasParaVencer(p.expirationDate) < LIMITES_VALIDADE.vencido),
      laranja: produtos.filter(p => { const dias = diasParaVencer(p.expirationDate); return dias >= LIMITES_VALIDADE.vencido && dias <= LIMITES_VALIDADE.urgente; }),
      amarelo: produtos.filter(p => { const dias = diasParaVencer(p.expirationDate); return dias > LIMITES_VALIDADE.urgente && dias <= LIMITES_VALIDADE.aviso; })
    };
    renderizarAlertasUI('alertas-unidades', alertasEstoque, criarAlertaEstoque);
    renderizarAlertasUI('alertas-validade', alertasValidade, criarAlertaValidade);
    const totalAlertas = Object.values(alertasEstoque).reduce((sum, arr) => sum + arr.length, 0) +
      Object.values(alertasValidade).reduce((sum, arr) => sum + arr.length, 0);
    qtdAlertasEl.textContent = totalAlertas;
  } catch (err) {
    alertasUnidadesEl.innerHTML = `<p class="alert alert-danger p-2 mb-0">Erro ao carregar alertas: ${err.message}</p>`;
    alertasValidadeEl.innerHTML = `<p class="alert alert-danger p-2 mb-0">Erro ao carregar alertas: ${err.message}</p>`;
    qtdAlertasEl.textContent = 'X';
  } finally {
    if (reloadIcon) {
      setTimeout(() => { reloadIcon.classList.remove('spinner-icon'); }, 500);
    }
  }
}
const LIMITES_ESTOQUE = { critico: 10, medio: 30, semnecessidade: 50 };
const LIMITES_VALIDADE = { vencido: 0, urgente: 15, aviso: 30 };

function diasParaVencer(dataValidade) {
  if (!dataValidade) return Infinity;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const valDate = new Date(dataValidade);
  if (isNaN(valDate.getTime())) return Infinity;
  valDate.setHours(0, 0, 0, 0);
  const diffTime = valDate.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function renderizarAlertasUI(containerId, alertasPorTipo, funcaoCriarCard) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  let algumAlertaRenderizado = false;
  const tiposAlerta = [
    { tipo: 'vermelho', data: alertasPorTipo.vermelho, titulo: (prod, dias) => containerId === 'alertas-unidades' ? `Crítico: menos de ${LIMITES_ESTOQUE.critico} unidades` : 'Vencido!' },
    { tipo: 'laranja', data: alertasPorTipo.laranja, titulo: (prod, dias) => containerId === 'alertas-unidades' ? `Atenção: ${LIMITES_ESTOQUE.critico}-${LIMITES_ESTOQUE.medio - 1} unidades` : 'Vence em breve' },
    { tipo: 'amarelo', data: alertasPorTipo.amarelo, titulo: (prod, dias) => containerId === 'alertas-unidades' ? `Observação: ${LIMITES_ESTOQUE.medio}-${LIMITES_ESTOQUE.semnecessidade - 1} unidades` : 'Validade próxima' }
  ];
  tiposAlerta.forEach(alertaInfo => {
    if (alertaInfo.data && alertaInfo.data.length > 0) {
      alertaInfo.data.forEach(produto => {
        const dias = containerId === 'alertas-validade' ? diasParaVencer(produto.expirationDate) : null;
        container.appendChild(funcaoCriarCard(produto, dias, alertaInfo.tipo, alertaInfo.titulo(produto, dias)));
        algumAlertaRenderizado = true;
      });
    }
  });
  if (!algumAlertaRenderizado) {
    container.innerHTML = `<p class="text-muted p-2">Nenhum alerta ${containerId === 'alertas-unidades' ? 'de nível de estoque' : 'de validade'} no momento.</p>`;
  }
}
function criarAlertaEstoque(produto, diasIgnorado, tipoClasse, titulo) {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipoClasse} p-2 mb-2`;
  alerta.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div><strong style="font-size: 0.9em;">${produto.name}</strong><br><small style="font-size: 0.75em;">Cód: ${produto.barcode || 'N/A'}</small></div>
      <span class="badge rounded-pill bg-${tipoClasse === 'vermelho' ? 'danger' : tipoClasse === 'laranja' ? 'warning' : 'info'} text-dark">${produto.stock} unid.</span>
    </div><div class="mt-1"><span class="urgencia" style="font-size: 0.8em;">${titulo}</span></div>`;
  return alerta;
}
function criarAlertaValidade(produto, dias, tipoClasse, titulo) {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipoClasse} p-2 mb-2`;
  let diasMsg;
  if (dias === Infinity) diasMsg = "Data de validade não informada";
  else if (dias < 0) diasMsg = `Vencido há ${Math.abs(dias)} dia(s)`;
  else if (dias === 0) diasMsg = 'Vence hoje!';
  else diasMsg = `Vence em ${dias} dia(s)`;
  alerta.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div><strong style="font-size: 0.9em;">${produto.name}</strong><br><small style="font-size: 0.75em;">Cód: ${produto.barcode || 'N/A'}</small></div>
      <span class="badge rounded-pill bg-${tipoClasse === 'vermelho' ? 'danger' : tipoClasse === 'laranja' ? 'warning' : 'info'} text-dark">${produto.stock} unid.</span>
    </div><div class="mt-1"><span class="urgencia" style="font-size: 0.8em;">${titulo}</span><br>
    <small style="font-size: 0.75em;">${diasMsg} (${produto.expirationDate ? new Date(produto.expirationDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'})</small></div>`;
  return alerta;
}

function abrirModalExclusaoProduto() {
  // Pega o productId do input principal da página (que deve ter sido preenchido pelo clique no botão do card)
  const productIdParaExcluirInput = document.getElementById("codigo-excluir");
  if (!productIdParaExcluirInput) {
    showAlert("Erro de Interface", "Campo para código de exclusão não encontrado.", "error");
    return;
  }
  const productIdParaExcluir = productIdParaExcluirInput.value.trim();

  if (!productIdParaExcluir) {
    showAlert("Por favor, insira ou selecione o código do produto que deseja excluir.", "Código Necessário", "warning");
    productIdParaExcluirInput.focus(); // Foca no input para o usuário preencher
    return;
  }

  // Assume que 'window.currentData' é a lista de produtos carregada pelo script principal (estoque/script.js)
  if (typeof window.currentData === 'undefined' || !Array.isArray(window.currentData)) {
    showAlert("Lista de produtos não carregada. Não é possível obter detalhes para exclusão.", "Erro de Dados", "error");
    return;
  }

  const produto = window.currentData.find(p => String(p.productId) === String(productIdParaExcluir));

  if (!produto) {
    showAlert(`Produto com código "${productIdParaExcluir}" não encontrado na lista de estoque atual.`, "Produto Não Encontrado", "error");
    return;
  }


  // Preenche os spans de informação no modal #modalExcluirProduto
  // Certifique-se que os IDs no HTML do modal de exclusão correspondem a estes:
  const elNomeExcluir = document.getElementById("excluir-nome");
  const elCodigoExcluirDisplay = document.getElementById("excluir-codigo"); // Para exibir o ID do produto
  const elCategoriaExcluir = document.getElementById("excluir-categoria");
  const elEstoqueExcluir = document.getElementById("excluir-estoque");

  if (elNomeExcluir) elNomeExcluir.textContent = produto.name || 'Nome não informado';
  else console.warn("POPUP SCRIPT: Elemento #excluir-nome não encontrado no modal de exclusão.");

  if (elCodigoExcluirDisplay) elCodigoExcluirDisplay.textContent = produto.productId || '—';
  else console.warn("POPUP SCRIPT: Elemento #excluir-codigo (display) não encontrado no modal de exclusão.");

  if (elCategoriaExcluir) elCategoriaExcluir.textContent = produto.category || '—';
  else console.warn("POPUP SCRIPT: Elemento #excluir-categoria não encontrado no modal de exclusão.");

  if (elEstoqueExcluir) elEstoqueExcluir.textContent = (typeof produto.stock === 'number' ? produto.stock.toString() : '—') + ' unidades';
  else console.warn("POPUP SCRIPT: Elemento #excluir-estoque não encontrado no modal de exclusão.");

  // Mostra o modal de "detalhes do produto a ser excluído"
  const modalExcluirEl = document.getElementById("modalExcluirProduto");
  if (!modalExcluirEl) {
    showAlert("Erro Crítico de Interface", "O modal de detalhes da exclusão não pode ser encontrado.", "error");
    return;
  }
  const modalExcluirInstancia = bootstrap.Modal.getOrCreateInstance(modalExcluirEl);
  modalExcluirInstancia.show();

  // O botão "Excluir" dentro do modal #modalExcluirProduto no HTML já tem:
  // onclick="abrirConfirmarExclusao()"
  // Essa função abrirConfirmarExclusao() está no seu link.js e abre o SEGUNDO modal de confirmação.
  // Portanto, não precisamos adicionar um event listener para o botão de confirmação aqui.
}

// Inicialização no DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const currentMarketId = getMarketIdParaPopups();
  if (currentMarketId) {
    atualizarAlertas(currentMarketId);
    carregarSetoresGlobais(currentMarketId);
  } else {
    console.warn("POPUP SCRIPT: MarketID não disponível no DOMContentLoaded.");
    // Lógica para quando não há marketId (ex: limpar campos de alerta)
    const alertasUnidadesEl = document.getElementById('alertas-unidades');
    if (alertasUnidadesEl) alertasUnidadesEl.innerHTML = '<p class="text-muted p-2">ID do mercado não fornecido.</p>';
    const alertasValidadeEl = document.getElementById('alertas-validade');
    if (alertasValidadeEl) alertasValidadeEl.innerHTML = '<p class="text-muted p-2">ID do mercado não fornecido.</p>';
    const qtdAlertasEl = document.getElementById('quantidade-alertas');
    if (qtdAlertasEl) qtdAlertasEl.textContent = '0';
  }

  const reloadBtn = document.getElementById('btn-reload-alerts');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      const marketIdForReload = getMarketIdParaPopups();
      if (marketIdForReload) { atualizarAlertas(marketIdForReload); }
      else { showAlert("ID do Mercado não encontrado.", "Erro", "error"); }
    });
  }

  const offcanvasAlertasEl = document.getElementById('offcanvas-alertas');
  if (offcanvasAlertasEl) {
    offcanvasAlertasEl.addEventListener('show.bs.offcanvas', () => {
      const marketIdForOffcanvas = getMarketIdParaPopups();
      if (marketIdForOffcanvas) { atualizarAlertas(marketIdForOffcanvas); }
    });
  }

  const toggleTipoEl = document.getElementById("toggleTipo");
  if (toggleTipoEl) {
    toggleTipoEl.addEventListener('change', alternarTipoSetor);
    alternarTipoSetor(); // Estado inicial
  }
});