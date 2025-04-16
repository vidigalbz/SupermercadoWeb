// Função para limpar todos os filtros
function limparFiltros() {
    document.getElementById("filtro-categoria").value = "";
    document.getElementById("filtro-departamento").value = "";
    document.getElementById("pesquisa").value = "";
  
    // Chamada para atualizar a listagem se necessário
    // atualizarListaProdutos();
    console.log("Filtros limpos");
    carregarProdutos();
}
  
function abrirModalEdicao() {
  const codigo = document.getElementById("codigo-editar").value.trim();
  if (codigo === "") {
    const modal = new bootstrap.Modal(document.getElementById("modalCodigoObrigatorio"));
    modal.show();
    return;
  }

  abrirModalEditarProduto();
}
  
function abrirModalExclusao() {
  const codigo = document.getElementById("codigo-excluir").value.trim();
  if (codigo === "") {
    const modal = new bootstrap.Modal(document.getElementById("modalCodigoObrigatorio"));
    modal.show();
    return;
  }

  abrirModalExclusaoProduto()
}
  
function abrirModalDepCat() {
    const modal = new bootstrap.Modal(document.getElementById("modal-dep-cat"));
    modal.show();
}

function abrirConfirmarEdicao() {
  const modalEdicao = bootstrap.Modal.getInstance(document.getElementById("modalEdicao"));
  if (modalEdicao) modalEdicao.hide();

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
  console.log('Alterações salvas!');
}

function confirmarExclusaoFinal() {
  const modalConfirmar = bootstrap.Modal.getInstance(document.getElementById("modalConfirmarExclusao"));
  if (modalConfirmar) modalConfirmar.hide();

  const modalExclusao = bootstrap.Modal.getInstance(document.getElementById("modalExclusao"));
  if (modalExclusao) modalExclusao.hide();

  // Chama a função real de exclusão (opcional)
  excluirProduto();
}

// Botões de ação
document.getElementById("btn-pesquisar").addEventListener("click", () => {
  search();
});