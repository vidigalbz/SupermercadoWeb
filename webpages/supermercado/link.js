// Função para pegar o valor da pesquisa
function obterPesquisa() {
    const pesquisa = document.getElementById("pesquisa").value.trim();
    return pesquisa;
}
  
// Funções para pegar códigos de editar e excluir
function obterCodigoEditar() {
    return document.getElementById("codigo-editar").value.trim();
}
  
function obterCodigoExcluir() {
    return document.getElementById("codigo-excluir").value.trim();
}
  
// Funções para pegar filtros
function obterFiltroCategoria() {
    return document.getElementById("filtro-categoria").value;
}
  
function obterFiltroDepartamento() {
    return document.getElementById("filtro-departamento").value;
}
  
// Função para limpar todos os filtros
function limparFiltros() {
    document.getElementById("filtro-categoria").value = "";
    document.getElementById("filtro-departamento").value = "";
    document.getElementById("pesquisa").value = "";
  
    // Chamada para atualizar a listagem se necessário
    // atualizarListaProdutos();
    console.log("Filtros limpos");
}
  
// Abertura dos Modais
function abrirModalAdicionarItem() {
    const modal = new bootstrap.Modal(document.getElementById("modalAdicionarItem"));
    modal.show();
}
  
function abrirModalEdicao() {
  const codigo = document.getElementById("codigo-editar").value.trim();
  if (codigo === "") {
    const modal = new bootstrap.Modal(document.getElementById("modalCodigoObrigatorio"));
    modal.show();
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById("modalEditarProduto"));
  modal.show();
}
  
function abrirModalExclusao() {
  const codigo = document.getElementById("codigo-excluir").value.trim();
  if (codigo === "") {
    const modal = new bootstrap.Modal(document.getElementById("modalCodigoObrigatorio"));
    modal.show();
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById("modalExcluirProduto"));
  modal.show();
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

function confirmarEdicaoFinal() {
  // Fecha o modal de confirmação
  const modalConfirmar = bootstrap.Modal.getInstance(document.getElementById("modalConfirmarEdicao"));
  if (modalConfirmar) modalConfirmar.hide();

  // Fecha o modal principal de edição (caso ainda esteja aberto por algum motivo)
  const modalEdicao = bootstrap.Modal.getInstance(document.getElementById("modalEdicao"));
  if (modalEdicao) modalEdicao.hide();

  // Chama a função real de edição (opcional)
  realizarEdicao();
}

function confirmarExclusaoFinal() {
  const modalConfirmar = bootstrap.Modal.getInstance(document.getElementById("modalConfirmarExclusao"));
  if (modalConfirmar) modalConfirmar.hide();

  const modalExclusao = bootstrap.Modal.getInstance(document.getElementById("modalExclusao"));
  if (modalExclusao) modalExclusao.hide();

  // Chama a função real de exclusão (opcional)
  realizarExclusao();
}


// Botões de ação
document.getElementById("btn-pesquisar").addEventListener("click", () => {
  const termo = obterPesquisa();
  console.log("Pesquisando por:", termo);

      // Aqui você faria a filtragem dos produtos
      // filtrarProdutos(termo);
});
  
document.getElementById("btn-limpar-filtros").addEventListener("click", limparFiltros);