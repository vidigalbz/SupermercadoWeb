const categorias = ["Alimentos", "Bebidas", "Higiene", "Limpeza"];
const departamentos = ["Mercearia", "Gelados", "Farmácia", "Hortifruti"];
let tipoAtual = "Departamento"; // ou "Categoria"

function preencherCombosAdicao() {
  const selectCategoria = document.getElementById("add-categoria");
  const selectDepartamento = document.getElementById("add-departamento");

  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    selectCategoria.appendChild(option);
  });

  departamentos.forEach(dep => {
    const option = document.createElement("option");
    option.value = dep;
    option.textContent = dep;
    selectDepartamento.appendChild(option);
  });
}

function preencherCombosEdicao() {
  const selectCategoria = document.getElementById("editar-categoria");
  const selectDepartamento = document.getElementById("editar-departamento");

  // Limpa opções antigas (caso reabra o modal várias vezes)
  selectCategoria.innerHTML = '<option value="">Selecione</option>';
  selectDepartamento.innerHTML = '<option value="">Selecione</option>';

  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    selectCategoria.appendChild(option);
  });

  departamentos.forEach(dep => {
    const option = document.createElement("option");
    option.value = dep;
    option.textContent = dep;
    selectDepartamento.appendChild(option);
  });
}

function abrirModalAdicionarItem() {
    preencherCombosAdicao();

    const modal = new bootstrap.Modal(document.getElementById('modalAdicionarItem'));
    modal.show();

    document.getElementById('btn-confirmar-adicionar').onclick = function () {
        if (adicionarProduto() == true){
          modal.hide();
        }
    };
}

function abrirModalExclusaoProduto() {
  const productId = document.getElementById("codigo-excluir").value;
  const produto = currentData.find(p => String(p.productId) === String(productId));

  if (!produto) {
    alert("Produto não encontrado.");
    return;
  }

  // Preenche os dados no modal com formatação
  document.getElementById("codigo-excluir").value = produto.productId || '';
  document.getElementById("excluir-nome").textContent = produto.name || 'Nome não informado';
  document.getElementById("excluir-codigo").textContent = produto.productId || '—';
  document.getElementById("excluir-categoria").textContent = produto.category || '—';
  document.getElementById("excluir-estoque").textContent = formatarNumero(produto.stock);

  // Mostra o modal
  const modal = new bootstrap.Modal(document.getElementById("modalExcluirProduto"));
  modal.show();

  // Previne múltiplos event listeners
  const btnExcluir = document.getElementById("confirmar-exclusao");
  const novoBtn = btnExcluir.cloneNode(true);
  btnExcluir.parentNode.replaceChild(novoBtn, btnExcluir);

  novoBtn.addEventListener('click', async () => {
      modal.hide();
  });
}

// Função utilitária para formatar números com separador de milhar
function formatarNumero(valor) {
  if (!valor && valor !== 0) return '—';
  return Number(valor).toLocaleString('pt-BR');
}


const produtoExemplo = {
    nome: "Arroz Tio João",
    barcode: "7891234567890",
    preco: 14.99,
    categoria: "Alimentos",
    estoque: 50,
    lote: "L12345",
    departamento: "Mercearia",
    marketId: "MKT001",
    manufactureDate: "2024-11-01",
    expirationDate: "2025-11-01",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/800px-Placeholder_view_vector.svg.png"
};
  
function abrirModalEditarProduto(productId) {
  preencherCombosEdicao(); // Carrega os <select> de categorias e departamentos, por exemplo.
  console.log(currentData)
  // Caso o parâmetro não seja passado, tenta pegar do input manual
  if (!productId) {
    productId = document.getElementById("codigo-editar").value;
  }

  // Garante que o ID seja tratado como string para comparação
  const produto = currentData.find(p => String(p.productId) === String(productId));
  console.log("Produto encontrado para edição:", produto);
  
  if (!produto) {
    alert("Produto não encontrado.");
    return;
  }

  // Preenche os campos com os dados do produto
  document.getElementById('codigo-editar').value = produto.productId || '';
  document.getElementById('editar-nome').value = produto.name || '';
  document.getElementById('editar-barcode').value = produto.barcode || '';
  document.getElementById('editar-preco').value = produto.price || '';
  document.getElementById('editar-categoria').value = produto.category || '';
  document.getElementById('editar-estoque').value = produto.stock || '';
  document.getElementById('editar-lote').value = produto.lot || '';
  document.getElementById('editar-departamento').value = produto.departament || '';
  document.getElementById('editar-marketId').value = produto.marketId || '';
  document.getElementById('editar-fabricacao').value = produto.manufactureDate || '';
  document.getElementById('editar-validade').value = produto.expirationDate || '';
  // Nota: não é possível preencher um <input type="file"> via JavaScript por segurança

  const modal = new bootstrap.Modal(document.getElementById('modalEditarProduto'));
  modal.show();

  // Evita múltiplos bindings duplicados
  const btnConfirmar = document.getElementById('btn-confirmar-edicao');
  const novoBtn = btnConfirmar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);

  novoBtn.addEventListener('click', async () => {
    modal.hide();
  });
}

function preencherCombosCategoriasEDepartamentos() {
    const selectSetor = document.getElementById("select-excluir-setor");
    const selectDepartamento = document.getElementById("select-excluir-departamento");
  
    selectSetor.innerHTML = '<option value="">Selecione</option>';
    setores.forEach(s => {
      const option = document.createElement("option");
      option.value = s;
      option.textContent = s;
      selectSetor.appendChild(option);
    });
  
    selectDepartamento.innerHTML = '<option value="">Selecione</option>';
    departamentos.forEach(d => {
      const option = document.createElement("option");
      option.value = d;
      option.textContent = d;
      selectDepartamento.appendChild(option);
    });
}

function abrirModalDepCat() {
    // Reset toggle
    document.getElementById("toggleTipo").checked = false;
    tipoAtual = "Departamento";
    atualizarLabelTipo();
  
    // Preencher combo
    preencherCombo();
  
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById("modal-dep-cat"));
    modal.show();
}
  
function alternarTipo() {
  tipoAtual = document.getElementById("toggleTipo").checked ? "Categoria" : "Departamento";
  atualizarLabelTipo();
  preencherCombo();
}

function atualizarLabelTipo() {
  document.getElementById("label-add").textContent = `Nova ${tipoAtual}`;
  document.getElementById("label-select").textContent = tipoAtual;
}

function preencherComboExcluirSetor() {
  const select = document.getElementById("select-del");
  select.innerHTML = '<option value="">Selecione</option>';

  const lista = tipoAtual === "Departamento" ? departamentos : categorias;
  lista.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}
  
// Funções que você pode completar depois
function adicionarDepartamentoCategoria() {
  const valor = document.getElementById("input-novo").value.trim();
  if (!valor) return;

  if (tipoAtual === "Departamento") {
    departamentos.push(valor);
  } else {
    categorias.push(valor);
  }

  preencherCombo();
  document.getElementById("input-novo").value = "";
}
  
function excluirDepartamentoCategoria() {
  const select = document.getElementById("select-del");
  const valor = select.value;
  if (!valor) return;

  const lista = tipoAtual === "Departamento" ? departamentos : categorias;
  const index = lista.indexOf(valor);
  if (index > -1) {
    lista.splice(index, 1);
    preencherCombo();
  }
}

function alternarTipo() {
  const checked = document.getElementById("toggleTipo").checked;
  const label1 = document.getElementById("label-toggle");
  const label2 = document.getElementById("label-toggle-2");
  const labelAdd = document.getElementById("label-add");
  const labelSelect = document.getElementById("label-select");

  tipoAtual = checked ? "Categoria" : "Departamento";

  if (checked) {
    label1.classList.remove("active");
    label2.classList.add("active");
    labelAdd.innerText = "Nova Categoria";
    labelSelect.innerText = "Categoria";
  } else {
    label2.classList.remove("active");
    label1.classList.add("active");
    labelAdd.innerText = "Novo Departamento";
    labelSelect.innerText = "Departamento";
  }

  preencherCombo();
}

function atualizarAlertas(unidadeAlertas, validadeAlertas) {
  const containerUnidades = document.getElementById("alertas-unidades");
  const containerValidade = document.getElementById("alertas-validade");
  const total = unidadeAlertas.length + validadeAlertas.length;

  containerUnidades.innerHTML = "";
  containerValidade.innerHTML = "";

  unidadeAlertas.forEach(prod => {
    containerUnidades.innerHTML += criarCardAlerta(prod);
  });

  validadeAlertas.forEach(prod => {
    containerValidade.innerHTML += criarCardAlerta(prod);
  });

  document.getElementById("quantidade-alertas").textContent = total;
}

function criarCardAlerta(produto) {
  let classe = "alerta-amarelo";
  if (produto.urgencia === "alta") classe = "alerta-vermelho";
  else if (produto.urgencia === "media") classe = "alerta-laranja";

  return `
    <div class="alerta-card ${classe}">
      <strong>${produto.nome}</strong><br>
      <small><b>Cód:</b> ${produto.codigo} | <b>Qtd:</b> ${produto.quantidade} | <b>Validade:</b> ${produto.validade}</small>
    </div>
  `;
}

atualizarAlertas(
  [
    {
      nome: "Arroz",
      codigo: "P001",
      quantidade: 2,
      validade: "2025-04-20",
      urgencia: "alta" // 🔴 vermelho
    },
    {
      nome: "Feijão",
      codigo: "P002",
      quantidade: 5,
      validade: "2025-04-25",
      urgencia: "media" // 🟠 laranja
    },
    {
      nome: "Macarrão",
      codigo: "P003",
      quantidade: 9,
      validade: "2025-05-01",
      urgencia: "baixa" // 🟡 amarelo
    }
  ],
  [
    {
      nome: "Leite",
      codigo: "P004",
      quantidade: 10,
      validade: "2025-04-08",
      urgencia: "alta" // 🔴 vermelho
    },
    {
      nome: "Iogurte",
      codigo: "P005",
      quantidade: 15,
      validade: "2025-04-12",
      urgencia: "media" // 🟠 laranja
    },
    {
      nome: "Requeijão",
      codigo: "P006",
      quantidade: 20,
      validade: "2025-04-18",
      urgencia: "baixa" // 🟡 amarelo
    }
  ]
);

function preencherComboGerenciadorDeEstoque() {
  const select_cat = document.getElementById("filtro-categoria");
  const select_dep = document.getElementById("filtro-departamento");

  select_cat.innerHTML = '<option value="">Todos</option>';
  select_dep.innerHTML = '<option value="">Todos</option>';

  categorias.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select_cat.appendChild(option);
  });

  departamentos.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select_dep.appendChild(option);
  });
}

window.onload = preencherComboGerenciadorDeEstoque();