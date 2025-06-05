// webpages/estoque/link.js

// Assumindo que showAlert está em popups.js e acessível globalmente,
// ou defina uma versão local se necessário. Se já está em popups.js e este script
// é carregado depois, deve funcionar.
// function showAlert(message, title = 'Aviso', type = 'info') { ... }


function limparFiltros() {
    const filtroCat = document.getElementById("filtro-categoria");
    const filtroDep = document.getElementById("filtro-departamento");
    const pesquisaEl = document.getElementById("pesquisa");

    if(filtroCat) filtroCat.value = "";
    if(filtroDep) filtroDep.value = "";
    if(pesquisaEl) pesquisaEl.value = "";
  
    // Chama a função de busca/carregamento do script principal (estoque/script.js)
    // que deve usar o marketIdGlobal para recarregar todos os produtos.
    if (typeof searchEstoque === 'function') { // searchEstoque é do estoque/script.js
        searchEstoque(); // Chama sem filtros, o que deve carregar todos
    } else if (typeof carregarProdutos === 'function' && typeof marketIdGlobal !== 'undefined') { // Fallback para carregarProdutos
        carregarProdutos(marketIdGlobal);
    } else {
        console.error("Função para recarregar produtos (searchEstoque ou carregarProdutos) não encontrada.");
    }
    console.log("Filtros limpos.");
}
  
function abrirModalEdicao() { // Chamado pelo botão "Editar" principal da página
  const codigoInput = document.getElementById("codigo-editar");
  if (!codigoInput) {
      console.error("Input #codigo-editar não encontrado.");
      if(typeof showAlert === 'function') showAlert('Erro', 'Campo para código de edição não encontrado.', 'error');
      return;
  }
  const codigo = codigoInput.value.trim();
  if (codigo === "") {
    if(typeof showAlert === 'function') showAlert('Atenção', 'Insira o código do produto para editar.', 'warning');
    // Opcional: focar no input
    // codigoInput.focus();
    return;
  }
  // Chama a função de popups.js, que vai ler o código do input novamente e abrir o modal
  if (typeof abrirModalEditarProduto === 'function') { // abrirModalEditarProduto é de popups.js
      abrirModalEditarProduto();
  } else {
      console.error("Função abrirModalEditarProduto() não encontrada.");
  }
}
  
function abrirModalExclusao() { // Chamado pelo botão "Excluir" principal da página
  const codigoInput = document.getElementById("codigo-excluir");
   if (!codigoInput) {
      console.error("Input #codigo-excluir não encontrado.");
      if(typeof showAlert === 'function') showAlert('Erro', 'Campo para código de exclusão não encontrado.', 'error');
      return;
  }
  const codigo = codigoInput.value.trim();
  if (codigo === "") {
    if(typeof showAlert === 'function') showAlert('Atenção', 'Insira o código do produto para excluir.', 'warning');
    return;
  }
  // Chama a função de popups.js
  if (typeof abrirModalExclusaoProduto === 'function') { // abrirModalExclusaoProduto é de popups.js
    abrirModalExclusaoProduto(); // Esta função (em popups.js) vai ler o #codigo-excluir e preencher o modal de confirmação
  } else {
    console.error("Função abrirModalExclusaoProduto() não encontrada.");
  }
}
  
function abrirModalDepCat() { // Chamado pelo botão "Setores"
    // Chama a função de popups.js
    if (typeof abrirModalDepCat === 'function') { // A própria função de popups.js com este nome
        // Esta é uma chamada recursiva se não houver namespace.
        // Melhor seria o botão no HTML chamar diretamente `popups.abrirModalDepCat()` se você organizar em objetos,
        // ou garantir que a que está em popups.js é a que será chamada.
        // Vamos assumir que o HTML chama a versão correta de popups.js.
        // Esta chamada aqui é redundante se o HTML já chama a de popups.js.
        // Se o botão no HTML chama esta (de link.js), então esta precisa chamar a de popups.js
        // Se você tiver `abrirModalDepCat` em `popups.js`, chame-a de forma qualificada se possível,
        // ou garanta que só uma está no escopo global.
        // Para este exemplo, vou assumir que o HTML chama a função global que está em popups.js
        // window.abrirModalDepCat(); // Exemplo se ela for global em popups.js
        // Ou, se o botão no HTML tem onclick="abrirModalDepCat()", ele chamará a de popups.js se for carregada por último
        // e sobrescrever esta, ou vice-versa. É melhor nomear funções de forma única ou usar módulos/objetos.
        // Por ora, se o HTML chama abrirModalDepCat(), ela deve ser a de popups.js.
        // Esta função em link.js pode não ser necessária.
        // Contudo, se o HTML chama ESTA abrirModalDepCat (do link.js):
        if (window.abrirModalDepCatPopup) { // Supondo que a de popups.js seja window.abrirModalDepCatPopup
            window.abrirModalDepCatPopup();
        } else if (typeof popups !== "undefined" && typeof popups.abrirModalDepCat === "function") { // Se estiver num objeto popups
             popups.abrirModalDepCat();
        } else if (document.getElementById('modal-dep-cat')) { // Tenta chamar a global que deve ser a de popups.js
            const funcAbrirModalDepCatPopup = window.abrirModalDepCat; // Pode ser ela mesma
            if(typeof funcAbrirModalDepCatPopup === 'function') {
                 // Evitar recursão infinita se esta é a única função com este nome no escopo global
                 // O onclick no HTML deve chamar a função correta diretamente.
                 // Para agora, vou assumir que o botão do HTML chama a função em popups.js.
                 // Esta função em link.js é mais para agrupar os handlers que são chamados de outros locais.
            }
        } else {
            console.error("Função para abrir modal de setores não encontrada ou modal não existe.");
        }

    } else { // Se o botão do HTML chama diretamente a função de popups.js, esta não é necessária.
         console.warn("Função abrirModalDepCat em link.js não tem uma implementação clara para chamar a de popups.js sem risco de recursão ou conflito.");
    }
}


function abrirConfirmarEdicao() { // Chamado pelo botão "Salvar Alterações" do modal #modalEditarProduto
  // Validações básicas dos campos do modal #modalEditarProduto ANTES de abrir o modal de confirmação
  const nome = document.getElementById('editar-nome')?.value.trim();
  const precoStr = document.getElementById('editar-preco')?.value;
  const categoria = document.getElementById('editar-categoria')?.value;
  const estoqueStr = document.getElementById('editar-estoque')?.value;
  const departamento = document.getElementById('editar-departamento')?.value;

  if (!nome || !precoStr || !categoria || !estoqueStr || !departamento ) {
    if(typeof showAlert === 'function') showAlert("Preencha todos os campos obrigatórios no formulário de edição antes de confirmar.", "Campos Incompletos", "warning");
    return;
  }
  const preco = parseFloat(precoStr);
  const estoque = parseInt(estoqueStr);
  if (isNaN(preco) || isNaN(estoque)) {
    if(typeof showAlert === 'function') showAlert("Preço e Estoque devem ser números válidos na edição.", "Dados Inválidos", "warning");
    return;
  }
  // Outras validações podem ser adicionadas aqui (ex: data de validade vs fabricação)

  const modalConfirmarEl = document.getElementById("modalConfirmarEdicao");
  if(modalConfirmarEl){
    const modalConfirmar = bootstrap.Modal.getOrCreateInstance(modalConfirmarEl);
    modalConfirmar.show();
  } else {
    console.error("Modal de confirmação de edição #modalConfirmarEdicao não encontrado.");
  }
}

function abrirConfirmarExclusao() { // Chamado pelo botão "Excluir" do modal #modalExcluirProduto
  // O modal #modalExcluirProduto já está aberto. Esta função abre o #modalConfirmarExclusao.
  // Primeiro, esconde o modal de detalhes da exclusão (opcional, mas pode ser bom para UX)
  // const modalExcluirProdutoEl = document.getElementById("modalExcluirProduto");
  // if (modalExcluirProdutoEl) {
  //   const modalExcluirInst = bootstrap.Modal.getInstance(modalExcluirProdutoEl);
  //   if (modalExcluirInst) modalExcluirInst.hide();
  // }

  const modalConfirmarEl = document.getElementById("modalConfirmarExclusao");
  if(modalConfirmarEl){
    const modalConfirmar = bootstrap.Modal.getOrCreateInstance(modalConfirmarEl);
    modalConfirmar.show();
  } else {
    console.error("Modal de confirmação de exclusão #modalConfirmarExclusao não encontrado.");
  }
}

async function confirmarEdicaoFinal() { // Chamado pelo "Sim, editar" do modal #modalConfirmarEdicao
  const modalConfirmarEl = document.getElementById("modalConfirmarEdicao");
  if (modalConfirmarEl) {
    const modalConfirmar = bootstrap.Modal.getInstance(modalConfirmarEl);
    if (modalConfirmar) modalConfirmar.hide();
  }

  let sucessoNaEdicao = false;
  if (typeof confirmarEdicao === 'function') { // confirmarEdicao é de estoque/script.js
    sucessoNaEdicao = await confirmarEdicao();
  } else {
    console.error("Função confirmarEdicao() principal não encontrada.");
    if(typeof showAlert === 'function') showAlert("Erro Crítico", "Função de salvar edição não disponível.", "error");
    return;
  }

  if (sucessoNaEdicao) {
    console.log('LINK.JS: Alterações salvas com sucesso, modal de edição principal será fechado e página recarregada.');
    const modalEdicaoPrincipalEl = document.getElementById("modalEditarProduto");
    if (modalEdicaoPrincipalEl) {
      const modalEdicaoPrincipal = bootstrap.Modal.getInstance(modalEdicaoPrincipalEl);
      if (modalEdicaoPrincipal) modalEdicaoPrincipal.hide();
    }
    if (marketIdGlobal) { // Recarrega os produtos daquele mercado
        carregarProdutos(marketIdGlobal);
    } else {
        location.reload(); // Fallback para recarregar a página inteira
    }
  } else {
    console.log('LINK.JS: Falha ao salvar alterações. Modal de edição deve permanecer aberto para correção.');
    // Não recarrega, modal de edição já deve estar aberto ou o usuário pode reabri-lo.
  }
}

async function confirmarExclusaoFinal() { // Chamado pelo "Sim, excluir" do modal #modalConfirmarExclusao
  const modalConfirmarEl = document.getElementById("modalConfirmarExclusao");
  if (modalConfirmarEl) {
    const modalConfirmar = bootstrap.Modal.getInstance(modalConfirmarEl);
    if (modalConfirmar) modalConfirmar.hide();
  }
  
  // O modal #modalExcluirProduto (que mostra os detalhes do item a ser excluído) também deve ser fechado.
  const modalExcluirProdutoEl = document.getElementById("modalExcluirProduto");
   if (modalExcluirProdutoEl) {
    const modalExcluirInst = bootstrap.Modal.getInstance(modalExcluirProdutoEl);
    if (modalExcluirInst) modalExcluirInst.hide();
  }

  let sucessoNaExclusao = false;
  if (typeof excluirProduto === 'function') { // excluirProduto é de estoque/script.js
    sucessoNaExclusao = await excluirProduto();
  } else {
    console.error("Função excluirProduto() principal não encontrada.");
    if(typeof showAlert === 'function') showAlert("Erro Crítico", "Função de excluir produto não disponível.", "error");
    return;
  }

  if (sucessoNaExclusao) {
    console.log('LINK.JS: Produto excluído com sucesso. Recarregando produtos.');
    // carregarProdutos já é chamado dentro de excluirProduto se for bem-sucedido.
    // Se não, e se excluirProduto não recarregar, faça aqui:
    // if (marketIdGlobal) carregarProdutos(marketIdGlobal); else location.reload();
  } else {
    console.log('LINK.JS: Falha ao excluir produto.');
  }
}