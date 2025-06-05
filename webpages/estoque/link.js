// webpages/estoque/link.js

// Assumindo que showAlert está em popups.js e acessível globalmente,
// ou defina uma versão local se necessário.

function limparFiltros() {
    const filtroCat = document.getElementById("filtro-categoria");
    const filtroDep = document.getElementById("filtro-departamento");
    const pesquisaEl = document.getElementById("pesquisa");

    if (filtroCat) filtroCat.value = "";
    if (filtroDep) filtroDep.value = "";
    if (pesquisaEl) pesquisaEl.value = "";

    // Chama a função de busca/carregamento do script principal (estoque/script.js)
    // que deve usar marketIdGlobal para recarregar todos os produtos.
    if (typeof searchEstoque === 'function') {
        searchEstoque(); // Carrega sem filtros
    } else if (typeof carregarProdutos === 'function' && typeof marketIdGlobal !== 'undefined') {
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
        if (typeof showAlert === 'function') showAlert('Erro', 'Campo para código de edição não encontrado.', 'error');
        return;
    }
    const codigo = codigoInput.value.trim();
    if (codigo === "") {
        if (typeof showAlert === 'function') showAlert('Atenção', 'Insira o código do produto para editar.', 'warning');
        return;
    }
    // Chama a função de popups.js, que vai ler o código do input novamente e abrir o modal
    if (typeof abrirModalEditarProduto === 'function') {
        abrirModalEditarProduto();
    } else {
        console.error("Função abrirModalEditarProduto() não encontrada.");
    }
}

function abrirModalExclusao() { // Chamado pelo botão "Excluir" principal da página
    const codigoInput = document.getElementById("codigo-excluir");
    if (!codigoInput) {
        console.error("Input #codigo-excluir não encontrado.");
        if (typeof showAlert === 'function') showAlert('Erro', 'Campo para código de exclusão não encontrado.', 'error');
        return;
    }
    const codigo = codigoInput.value.trim();
    if (codigo === "") {
        if (typeof showAlert === 'function') showAlert('Atenção', 'Insira o código do produto para excluir.', 'warning');
        return;
    }
    // Chama a função de popups.js
    if (typeof abrirModalExclusaoProduto === 'function') {
        abrirModalExclusaoProduto();
    } else {
        console.error("Função abrirModalExclusaoProduto() não encontrada.");
    }
}

function abrirModalDepCat() { // Chamado pelo botão "Setores"
    if (typeof popups !== "undefined" && typeof popups.abrirModalDepCat === "function") {
        popups.abrirModalDepCat();
    } else if (typeof abrirModalDepCatPopup === "function") {
        abrirModalDepCatPopup();
    } else {
        console.error("Função para abrir modal de setores não encontrada ou modal não existe.");
    }
}

function abrirConfirmarEdicao() { // Chamado pelo botão "Salvar Alterações" do modal #modalEditarProduto
    const nome = document.getElementById('editar-nome')?.value.trim();
    const precoStr = document.getElementById('editar-preco')?.value;
    const categoria = document.getElementById('editar-categoria')?.value;
    const estoqueStr = document.getElementById('editar-estoque')?.value;
    const departamento = document.getElementById('editar-departamento')?.value;

    if (!nome || !precoStr || !categoria || !estoqueStr || !departamento) {
        if (typeof showAlert === 'function') showAlert("Preencha todos os campos obrigatórios no formulário de edição antes de confirmar.", "Campos Incompletos", "warning");
        return;
    }
    const preco = parseFloat(precoStr);
    const estoque = parseInt(estoqueStr);
    if (isNaN(preco) || isNaN(estoque)) {
        if (typeof showAlert === 'function') showAlert("Preço e Estoque devem ser números válidos na edição.", "Dados Inválidos", "warning");
        return;
    }
    // Outras validações podem ser adicionadas aqui

    const modalConfirmarEl = document.getElementById("modalConfirmarEdicao");
    if (modalConfirmarEl) {
        const modalConfirmar = bootstrap.Modal.getOrCreateInstance(modalConfirmarEl);
        modalConfirmar.show();
    } else {
        console.error("Modal de confirmação de edição #modalConfirmarEdicao não encontrado.");
    }
}

function abrirConfirmarExclusao() { // Chamado pelo botão "Excluir" do modal #modalExcluirProduto
    const modalConfirmarEl = document.getElementById("modalConfirmarExclusao");
    if (modalConfirmarEl) {
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

    const modalEdicaoPrincipalEl = document.getElementById("modalEditarProduto");
    if (modalEdicaoPrincipalEl) {
        const modalEdicaoPrincipal = bootstrap.Modal.getInstance(modalEdicaoPrincipalEl);
        if (modalEdicaoPrincipal) modalEdicaoPrincipal.hide();
    }

    if (typeof confirmarEdicao === 'function') {
        const sucessoNaEdicao = await confirmarEdicao();
        if (sucessoNaEdicao) {
            console.log('LINK.JS: Alterações salvas com sucesso. Recarregando produtos.');
            if (typeof carregarProdutos === 'function' && typeof marketIdGlobal !== 'undefined') {
                carregarProdutos(marketIdGlobal);
            } else {
                location.reload();
            }
        } else {
            console.log('LINK.JS: Falha ao salvar alterações. Modal de edição permanece aberto.');
        }
    } else {
        console.error("Função confirmarEdicao() não encontrada.");
        if (typeof showAlert === 'function') showAlert("Erro Crítico", "Função de salvar edição não disponível.", "error");
    }
}

async function confirmarExclusaoFinal() { // Chamado pelo "Sim, excluir" do modal #modalConfirmarExclusao
    const modalConfirmarEl = document.getElementById("modalConfirmarExclusao");
    if (modalConfirmarEl) {
        const modalConfirmar = bootstrap.Modal.getInstance(modalConfirmarEl);
        if (modalConfirmar) modalConfirmar.hide();
    }
    const modalExcluirProdutoEl = document.getElementById("modalExcluirProduto");
    if (modalExcluirProdutoEl) {
        const modalExcluirInst = bootstrap.Modal.getInstance(modalExcluirProdutoEl);
        if (modalExcluirInst) modalExcluirInst.hide();
    }

    if (typeof excluirProduto === 'function') {
        const sucessoNaExclusao = await excluirProduto();
        if (sucessoNaExclusao) {
            console.log('LINK.JS: Produto excluído com sucesso. Recarregando produtos.');
            if (typeof carregarProdutos === 'function' && typeof marketIdGlobal !== 'undefined') {
                carregarProdutos(marketIdGlobal);
            } else {
                location.reload();
            }
        } else {
            console.log('LINK.JS: Falha ao excluir produto.');
        }
    } else {
        console.error("Função excluirProduto() não encontrada.");
        if (typeof showAlert === 'function') showAlert("Erro Crítico", "Função de excluir produto não disponível.", "error");
    }
}

// Se houver um botão de pesquisa principal, atribuir evento
const btnPesquisar = document.getElementById("btn-pesquisar");
if (btnPesquisar) {
    btnPesquisar.addEventListener("click", () => {
        if (typeof searchEstoque === 'function') {
            searchEstoque();
        } else if (typeof carregarProdutos === 'function' && typeof marketIdGlobal !== 'undefined') {
            carregarProdutos(marketIdGlobal);
        }
    });
}   
