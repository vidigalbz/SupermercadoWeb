// webpages/estoque/link.js

// Assumindo que showAlert está definida em popups.js e é acessível globalmente,
// ou você pode definir uma versão local/importá-la se usar módulos.

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

function limparFiltros() {
  const filtroCat = document.getElementById("filtro-categoria");
  const filtroDep = document.getElementById("filtro-departamento");
  const pesquisaEl = document.getElementById("pesquisa");

  if (filtroCat) filtroCat.value = "";
  if (filtroDep) filtroDep.value = "";
  if (pesquisaEl) pesquisaEl.value = "";

  // Chama a função de busca/carregamento do script principal (estoque/script.js)
  // searchEstoque() deve usar o marketIdGlobal internamente.
  if (typeof searchEstoque === 'function') {
      searchEstoque(); // searchEstoque em estoque/script.js deve lidar com marketId
  } else if (typeof carregarProdutos === 'function') {
      const currentMarketId = getCookie("marketId"); // Pega o marketId atual
      if (currentMarketId) {
          carregarProdutos(currentMarketId);
      } else {

      }
  } else {

  }
}

function abrirModalEdicao() { // Chamada pelo botão "Editar" principal da página (ao lado do input #codigo-editar)
  const codigoInput = document.getElementById("codigo-editar");
  if (!codigoInput) {

      if (typeof showAlert === 'function') showAlert('Erro de Interface', 'Campo para código de edição não encontrado.', 'error');
      return;
  }
  const codigo = codigoInput.value.trim();
  if (codigo === "") {
      if (typeof showAlert === 'function') showAlert('Atenção', 'Insira o código do produto para editar.', 'warning');
      codigoInput.focus();
      return;
  }

  // Chama a função de popups.js, que vai ler o 'codigo' novamente e abrir o modal
  if (typeof abrirModalEditarProduto === 'function') { // abrirModalEditarProduto é de popups.js
      abrirModalEditarProduto();
  } else {
      if (typeof showAlert === 'function') showAlert('Erro de Script', 'Funcionalidade de edição indisponível.', 'error');
  }
}

function abrirModalExclusao() { // Chamada pelo botão "Excluir" principal da página (ao lado do input #codigo-excluir)
  const codigoInput = document.getElementById("codigo-excluir");
  if (!codigoInput) {
      if (typeof showAlert === 'function') showAlert('Erro de Interface', 'Campo para código de exclusão não encontrado.', 'error');
      return;
  }
  const codigo = codigoInput.value.trim();
  if (codigo === "") {
      if (typeof showAlert === 'function') showAlert('Atenção', 'Insira o código do produto para excluir.', 'warning');
      codigoInput.focus();
      return;
  }

  // Chama a função de popups.js, que vai ler o 'codigo' e abrir o modal de detalhes para exclusão
  if (typeof abrirModalExclusaoProduto === 'function') { // abrirModalExclusaoProduto é de popups.js
      abrirModalExclusaoProduto();
  } else {
      if (typeof showAlert === 'function') showAlert('Erro de Script', 'Funcionalidade de exclusão indisponível.', 'error');
  }
}

// A função abrirModalDepCat() no HTML deve chamar diretamente a função
// abrirModalDepCat() que está definida em popups/script.js.
// Não há necessidade de uma função intermediária com o mesmo nome em link.js,
// a menos que haja uma lógica específica do link.js antes de chamar a de popups.js.
// Para evitar confusão, se o botão no HTML tem onclick="abrirModalDepCat()",
// certifique-se que a ÚNICA função global com esse nome seja a de popups.js.
// Vou remover a implementação confusa daqui para evitar problemas. Se você precisar dela,
// ela deve ter um nome único ou chamar a de popups.js explicitamente e corretamente.
/*
function abrirModalDepCat() {
  console.warn("LINK.JS: abrirModalDepCat() chamada. O onclick no HTML deve chamar diretamente a função de popups.js.");
  if (typeof window.abrirModalDepCat === 'function' && window.abrirModalDepCat !== abrirModalDepCat) { // Garante que não é ela mesma
       window.abrirModalDepCat(); // Tenta chamar a global, que deve ser a de popups.js
  } else if (document.getElementById('modal-dep-cat') && typeof popups !== "undefined" && typeof popups.abrirModalDepCat === 'function'){
      popups.abrirModalDepCat(); // Se estiver organizada em um objeto
  } else {
      console.error("LINK.JS: Não foi possível determinar qual abrirModalDepCat chamar de popups.js.");
      if(typeof showAlert === 'function') showAlert("Erro", "Não foi possível abrir o gerenciador de setores.", "error");
  }
}
*/


function abrirConfirmarEdicao() { // Chamado pelo botão "Salvar Alterações" do modal #modalEditarProduto
  // Validação dos campos do modal de edição ANTES de mostrar o modal de confirmação.
  // Esses IDs são do modal #modalEditarProduto
  const nome = document.getElementById('editar-nome')?.value.trim();
  const precoStr = document.getElementById('editar-preco')?.value;
  const categoria = document.getElementById('editar-categoria')?.value;
  const estoqueStr = document.getElementById('editar-estoque')?.value;
  const departamento = document.getElementById('editar-departamento')?.value;
  // Adicione outros campos obrigatórios aqui se necessário para validação
  const barcode = document.getElementById('editar-barcode')?.value.trim();
  const lote = document.getElementById('editar-lote')?.value.trim();
  const fabricacao = document.getElementById('editar-fabricacao')?.value;
  const validade = document.getElementById('editar-validade')?.value;


  if (!nome || !precoStr || !categoria || !estoqueStr || !departamento || !barcode || !lote || !fabricacao || !validade) {
      if (typeof showAlert === 'function') showAlert("Campos Incompletos", "Preencha todos os campos obrigatórios no formulário de edição antes de confirmar.", "warning");
      else alert("Preencha todos os campos obrigatórios no formulário de edição antes de confirmar.");
      return;
  }
  const preco = parseFloat(precoStr);
  const estoque = parseInt(estoqueStr);
  if (isNaN(preco) || preco <=0 || isNaN(estoque) || estoque < 0) {
      if (typeof showAlert === 'function') showAlert("Dados Inválidos", "Preço e Estoque devem ser números válidos (Preço > 0, Estoque >= 0).", "warning");
      else alert("Preço e Estoque devem ser números válidos.");
      return;
  }
  if (fabricacao && validade && new Date(fabricacao) > new Date(validade)) {
      if(typeof showAlert === 'function') showAlert('Data Inválida', 'A data de fabricação não pode ser posterior à data de validade!', 'warning');
      else alert('A data de fabricação não pode ser posterior à data de validade!');
      return;
  }


  const modalConfirmarEl = document.getElementById("modalConfirmarEdicao");
  if (modalConfirmarEl) {
      const modalConfirmar = bootstrap.Modal.getOrCreateInstance(modalConfirmarEl);
      modalConfirmar.show();
  } else {
      if (typeof showAlert === 'function') showAlert('Erro de Interface', 'Modal de confirmação não encontrado.', 'error');
  }
}

function abrirConfirmarExclusao() { // Chamado pelo botão "Excluir" do modal #modalExcluirProduto
  // O modal #modalExcluirProduto (que mostra os detalhes do item) já está aberto.
  // Esta função abre o #modalConfirmarExclusao (o pequeno modal de "Tem certeza?").

  const modalConfirmarEl = document.getElementById("modalConfirmarExclusao");
  if (modalConfirmarEl) {
      const modalConfirmar = bootstrap.Modal.getOrCreateInstance(modalConfirmarEl);
      modalConfirmar.show();
  } else {
      if (typeof showAlert === 'function') showAlert('Erro de Interface', 'Modal de confirmação de exclusão não encontrado.', 'error');
  }
}

async function confirmarEdicaoFinal() { // Chamado pelo "Sim, editar" do modal #modalConfirmarEdicao
  const modalConfirmarEl = document.getElementById("modalConfirmarEdicao");
  if (modalConfirmarEl) {
      const modalConfirmar = bootstrap.Modal.getInstance(modalConfirmarEl);
      if (modalConfirmar) modalConfirmar.hide(); // Esconde o modal de confirmação
  }

  let sucessoNaEdicao = false;
  if (typeof confirmarEdicao === 'function') { // confirmarEdicao é de estoque/script.js
      sucessoNaEdicao = await confirmarEdicao(); // Deve retornar true para sucesso, false para falha
  } else {
      if (typeof showAlert === 'function') showAlert("Erro Crítico", "Função de salvar edição não disponível.", "error");
      return;
  }

  if (sucessoNaEdicao) {
      const modalEdicaoPrincipalEl = document.getElementById("modalEditarProduto");
      if (modalEdicaoPrincipalEl) {
          const modalEdicaoPrincipal = bootstrap.Modal.getInstance(modalEdicaoPrincipalEl);
          if (modalEdicaoPrincipal) modalEdicaoPrincipal.hide(); // Esconde o modal principal de edição
      }

  } else {
  }
}

async function confirmarExclusaoFinal() {
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

  let sucessoNaExclusao = false;
  if (typeof excluirProduto === 'function') {
      sucessoNaExclusao = await excluirProduto();
  } else {
      if (typeof showAlert === 'function') showAlert("Erro Crítico", "Função de excluir produto não disponível.", "error");
      return;
  }

}

function impressao(codigo){
    JsBarcode("#barcode", codigo, {
      format: "CODE128",
      displayValue: true,
      fontSize: 18,
      width: 2,
      height: 100
    })
  
    const janela = window.open("", "_blank");
  
    janela.document.write(
      `<html>
        <head>
          <title>Imprimir Código de Barras</title>
          <style>
            body {
              text-align: center;
              margin: 0;
              padding: 20px;
              font-family: sans-serif;
            }
            svg {
              width: 300px;
              height: auto;
            }
          </style>
        </head>
        <body>
          <h2>Código de Barras</h2>
          ${barcode.outerHTML}
          <script>
            setTimeout(() => {
                          window.print();
                          setTimeout(() => window.close(), 500);
                      }, 200);
          </script>
        </body>
      </html>`
    )
    barcode.innerHTML = ""
  }
