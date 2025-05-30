function showAlert(message, title = 'Aviso', type = 'info') {
  // Cria container se não existir
  let container = document.querySelector('.toast-wrapper');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-wrapper';
    document.body.appendChild(container);
  }

  // Cria o toast
  const toastEl = document.createElement('div');
  toastEl.className = `toast show toast-${type}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">${title}</strong>
      <small class="text-white">Agora</small>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  // Adiciona no início (para novos aparecerem em cima)
  container.insertBefore(toastEl, container.firstChild);

  // Configura auto-fechamento
  const toast = new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 5000
  });

  toast.show();

  // Remove após fechar
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
    // Remove container se não houver mais toasts
    if (container.children.length === 0) {
      container.remove();
    }
  });
}

// Função para limpar todos os filtros
function limparFiltros() {
    document.getElementById("filtro-categoria").value = "";
    document.getElementById("filtro-departamento").value = "";
    document.getElementById("pesquisa").value = "";
  
    // Chamada para atualizar a listagem se necessário
    // atualizarListaProdutos();
    carregarProdutos();
}
  
function abrirModalEdicao() {
  const codigo = document.getElementById("codigo-editar").value.trim();
  if (codigo === "") {
    mostrarNotificacao('Atenção', 'Por favor, insira o código do produto antes de continuar.', 'warning');
    modal.show();
    return;
  }

  abrirModalEditarProduto();
}
  
function abrirModalExclusao() {
  const codigo = document.getElementById("codigo-excluir").value.trim();
  if (codigo === "") {
    mostrarNotificacao('Ação necessária', 'Por favor, insira o código do produto que deseja excluir.', 'warning');
    return;
  }
  abrirModalExclusaoProduto();
}
  
function abrirModalDepCat() {
    const modal = new bootstrap.Modal(document.getElementById("modal-dep-cat"));
    modal.show();
}

function abrirConfirmarEdicao() {
  const camposObrigatorios = [
    'editar-nome',
    'editar-barcode',
    'editar-preco',
    'editar-categoria',
    'editar-estoque',
    'editar-lote',
    'editar-departamento',
    'editar-marketId',
    'editar-fabricacao',
    'editar-validade'
  ];

  let camposVazios = [];

  camposObrigatorios.forEach(id => {
    const campo = document.getElementById(id);
    const valor = campo.value.trim();

    campo.classList.remove('is-invalid');

    if (!valor) {
      camposVazios.push(campo);
    }
  });

  if (camposVazios.length > 0) {
    camposVazios.forEach(campo => campo.classList.add('is-invalid'));
    showAlert("Preencha todos os campos obrigatórios antes de confirmar.", "Aviso", "warning");
    return;
  }

  const modalConfirmar = new bootstrap.Modal(document.getElementById("modalConfirmarEdicao"));
  modalConfirmar.show();
}

function abrirConfirmarExclusao() {
  const modalExclusao = bootstrap.Modal.getInstance(document.getElementById("modalExclusao"));
  if (modalExclusao) modalExclusao.hide();

  const modalConfirmar = new bootstrap.Modal(document.getElementById("modalConfirmarExclusao"));
  modalConfirmar.show();
}

async function confirmarEdicaoFinal() {
  // Fecha o modal de confirmação
  const modalConfirmar = bootstrap.Modal.getInstance(document.getElementById("modalConfirmarEdicao"));
  if (modalConfirmar) modalConfirmar.hide();

  // Fecha o modal principal de edição (caso ainda esteja aberto por algum motivo)
  const modalEdicao = bootstrap.Modal.getInstance(document.getElementById("modalEdicao"));
  if (modalEdicao) modalEdicao.hide();

  // Chama a função real de edição (opcional)
  await confirmarEdicao();
  location.reload()
}

function confirmarExclusaoFinal() {
  const modalConfirmar = bootstrap.Modal.getInstance(document.getElementById("modalConfirmarExclusao"));
  if (modalConfirmar) modalConfirmar.hide();

  const modalExclusao = bootstrap.Modal.getInstance(document.getElementById("modalExclusao"));
  if (modalExclusao) modalExclusao.hide();

  // Chama a função real de exclusão (opcional)
  location.reload()
  excluirProduto();
}

// Botões de ação
document.getElementById("btn-pesquisar").addEventListener("click", () => {
  search();
});