let categorias;
let departamentos;
let tipoAtual = "Departamento"; // ou "Categoria"

const critico = 10
const medio = 30
const semnecessidade = 50

function carregarSetoresGlobais() {
  fetch('/getSetor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  .then(res => res.json())
  .then(data => {
    categorias = data.cat;
    departamentos = data.dept;
  })
  .catch(err => console.error("Erro ao carregar setores:", err));
}

function preencherCombosAdicao() {
  const selectCategoria = document.getElementById("add-categoria");
  const selectDepartamento = document.getElementById("add-departamento");

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

function preencherCombosEdicao() {
  const selectCategoria = document.getElementById("editar-categoria");
  const selectDepartamento = document.getElementById("editar-departamento");

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

function abrirModalDepCat() {
    // Reset toggle
    document.getElementById("toggleTipo").checked = false;
    tipoAtual = "Departamento";
    atualizarLabelTipo();
  
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById("modal-dep-cat"));
    modal.show();
    preencherComboExcluirSetor();
}
  
function alternarTipo() {
  tipoAtual = document.getElementById("toggleTipo").checked ? "Categoria" : "Departamento";
  atualizarLabelTipo();
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

function adicionarDepartamentoCategoria() {
  const valor = document.getElementById("input-novo").value.trim();
  if (!valor) return;

  const tipo = tipoAtual === "Departamento" ? "dept" : "cat";

  fetch('/addSetor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: valor, type: tipo })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.mensagem || "Adicionado com sucesso!");
    document.getElementById("input-novo").value = "";
    atualizarSelectSetores(); // Atualiza o select do modal
  })
  .catch(err => {
    console.error(err);
    alert("Erro ao adicionar setor.");
  });
}
  
function excluirDepartamentoCategoria() {
  const select = document.getElementById("select-del");
  const valor = select.value;
  if (!valor) return;

  const tipo = tipoAtual === "Departamento" ? "dept" : "cat";

  fetch('/deleteSetor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: valor, type: tipo })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.mensagem || "Excluído com sucesso!");
    atualizarSelectSetores(); // Atualiza o select do modal
  })
  .catch(err => {
    console.error(err);
    alert("Erro ao excluir setor.");
  });
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

  preencherComboExcluirSetor();
}

// Configurações de limites
const LIMITES_ESTOQUE = {
  critico: 10,       // Vermelho - menos de 10 unidades
  medio: 30,         // Laranja - entre 10 e 29 unidades
  semnecessidade: 50 // Amarelo - entre 30 e 49 unidades
};

const LIMITES_VALIDADE = {
  vencido: 0,        // Vermelho - já vencido (dias < 0)
  urgente: 15,       // Laranja - vence em 0-15 dias
  aviso: 30          // Amarelo - vence em 16-30 dias
};

// Função para calcular dias até a validade (retorna negativo se vencido)
function diasParaVencer(dataValidade) {
  if (!dataValidade) return Infinity;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Ignorar horas para cálculo de dias
  
  const valDate = new Date(dataValidade);
  valDate.setHours(0, 0, 0, 0);
  
  const diffTime = valDate - hoje;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Função principal para atualizar alertas
async function atualizarAlertas() {
  try {
    // Buscar todos os produtos
    const response = await fetch('/estoqueData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    const produtos = data.mensagem;
    
    // Filtrar produtos por nível de estoque
    const alertasEstoque = {
      vermelho: produtos.filter(p => p.stock < LIMITES_ESTOQUE.critico),
      laranja: produtos.filter(p => 
        p.stock >= LIMITES_ESTOQUE.critico && 
        p.stock < LIMITES_ESTOQUE.medio),
      amarelo: produtos.filter(p => 
        p.stock >= LIMITES_ESTOQUE.medio && 
        p.stock < LIMITES_ESTOQUE.semnecessidade)
    };
    
    // Filtrar produtos por validade
    const alertasValidade = {
      vermelho: produtos.filter(p => {
        const dias = diasParaVencer(p.expirationDate);
        return dias < LIMITES_VALIDADE.vencido; // Já vencidos
      }),
      laranja: produtos.filter(p => {
        const dias = diasParaVencer(p.expirationDate);
        return dias >= LIMITES_VALIDADE.vencido && 
               dias <= LIMITES_VALIDADE.urgente; // Vence em 0-15 dias
      }),
      amarelo: produtos.filter(p => {
        const dias = diasParaVencer(p.expirationDate);
        return dias > LIMITES_VALIDADE.urgente && 
               dias <= LIMITES_VALIDADE.aviso; // Vence em 16-30 dias
      })
    };
    
    // Atualizar a exibição
    atualizarAlertasEstoque(alertasEstoque);
    atualizarAlertasValidade(alertasValidade);
    
    // Atualizar contador total
    const totalAlertas = 
      alertasEstoque.vermelho.length + 
      alertasEstoque.laranja.length + 
      alertasEstoque.amarelo.length + 
      alertasValidade.vermelho.length +
      alertasValidade.laranja.length +
      alertasValidade.amarelo.length;
    
    document.getElementById('quantidade-alertas').textContent = totalAlertas;
    
  } catch (err) {
    console.error('Erro ao atualizar alertas:', err);
  }
}

// Atualiza a seção de alertas de estoque
function atualizarAlertasEstoque(alertasEstoque) {
  const container = document.getElementById('alertas-unidades');
  container.innerHTML = '';
  
  // Adicionar alertas vermelhos (menos de 10 unidades)
  alertasEstoque.vermelho.forEach(produto => {
    container.appendChild(
      criarAlertaEstoque(
        produto, 
        'vermelho', 
        `Crítico: menos de ${LIMITES_ESTOQUE.critico} unidades`
      )
    );
  });
  
  // Adicionar alertas laranja (10-29 unidades)
  alertasEstoque.laranja.forEach(produto => {
    container.appendChild(
      criarAlertaEstoque(
        produto, 
        'laranja', 
        `Atenção: ${LIMITES_ESTOQUE.critico}-${LIMITES_ESTOQUE.medio-1} unidades`
      )
    );
  });
  
  // Adicionar alertas amarelos (30-49 unidades)
  alertasEstoque.amarelo.forEach(produto => {
    container.appendChild(
      criarAlertaEstoque(
        produto, 
        'amarelo', 
        `Observação: ${LIMITES_ESTOQUE.medio}-${LIMITES_ESTOQUE.semnecessidade-1} unidades`
      )
    );
  });
}

// Atualiza a seção de alertas de validade
function atualizarAlertasValidade(alertasValidade) {
  const container = document.getElementById('alertas-validade');
  container.innerHTML = '';
  
  // Alertas vermelhos (já vencidos)
  alertasValidade.vermelho.forEach(produto => {
    const dias = diasParaVencer(produto.expirationDate);
    container.appendChild(
      criarAlertaValidade(
        produto, 
        dias, 
        'vermelho', 
        'Vencido!'
      )
    );
  });
  
  // Alertas laranja (vence em 0-15 dias)
  alertasValidade.laranja.forEach(produto => {
    const dias = diasParaVencer(produto.expirationDate);
    container.appendChild(
      criarAlertaValidade(
        produto, 
        dias, 
        'laranja', 
        'Vence em breve'
      )
    );
  });
  
  // Alertas amarelos (vence em 16-30 dias)
  alertasValidade.amarelo.forEach(produto => {
    const dias = diasParaVencer(produto.expirationDate);
    container.appendChild(
      criarAlertaValidade(
        produto, 
        dias, 
        'amarelo', 
        'Validade próxima'
      )
    );
  });
}

// Cria um card de alerta para estoque baixo
function criarAlertaEstoque(produto, tipo, titulo) {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  alerta.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <strong>${produto.name}</strong><br>
        <small>Cód: ${produto.barcode || 'N/A'}</small>
      </div>
      <span class="badge bg-${tipo}">${produto.stock} unid.</span>
    </div>
    <div class="mt-2">
      <span class="urgencia">${titulo}</span>
    </div>
  `;
  return alerta;
}

// Cria um card de alerta para validade próxima
function criarAlertaValidade(produto, dias, tipo, titulo) {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  
  // Formata mensagem de dias
  let diasMsg;
  if (dias < 0) {
    diasMsg = `Vencido há ${Math.abs(dias)} dias`;
  } else if (dias === 0) {
    diasMsg = 'Vence hoje!';
  } else {
    diasMsg = `Vence em ${dias} dias`;
  }
  
  alerta.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <strong>${produto.name}</strong><br>
        <small>Cód: ${produto.barcode || 'N/A'}</small>
      </div>
      <span class="badge bg-${tipo}">${produto.stock} unid.</span>
    </div>
    <div class="mt-2">
      <span class="urgencia">${titulo}</span><br>
      <small>${diasMsg} (${produto.expirationDate || 'N/A'})</small>
    </div>
  `;
  return alerta;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Carregar alertas inicialmente
  atualizarAlertas();
  
  // Atualizar a cada 5 minutos
  setInterval(atualizarAlertas, 300000);
  
  // Atualizar quando o painel de alertas for aberto
  document.getElementById('offcanvas-alertas').addEventListener('show.bs.offcanvas', atualizarAlertas);
});

// Atualizar também quando os produtos são carregados
function carregarProdutos() {
  fetch('/estoqueData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
    .then(res => res.json())
    .then(data => {
      currentData = data.mensagem;
      renderizarProdutos(data.mensagem);
      atualizarAlertas();
    })
    .catch(err => console.error('Erro ao carregar produtos:', err));
}

function preencherCombosCategoriasEDepartamentos() {
  const selectSetor = document.getElementById("select-excluir-setor");
  const selectDepartamento = document.getElementById("select-excluir-departamento");

    selectSetor.innerHTML = '<option value="">Selecione</option>';
    selectDepartamento.innerHTML = '<option value="">Selecione</option>';

    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      selectSetor.appendChild(option);
    });

    departamentos.forEach(dep => {
      const option = document.createElement("option");
      option.value = dep;
      option.textContent = dep;
      selectDepartamento.appendChild(option);
    });
}

function preencherComboGerenciadorDeEstoque() {
  const select_cat = document.getElementById("filtro-categoria");
  const select_dep = document.getElementById("filtro-departamento");

  select_cat.innerHTML = '<option value="">Todos</option>';
  select_dep.innerHTML = '<option value="">Todos</option>';

  fetch('/getSetor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  .then(res => res.json())
  .then(data => {
    const categorias = data.cat;
    const departamentos = data.dept;

    categorias.forEach(nome => {
      const option = document.createElement("option");
      option.value = nome;
      option.textContent = nome;
      select_cat.appendChild(option);
    });

    departamentos.forEach(nome => {
      const option = document.createElement("option");
      option.value = nome;
      option.textContent = nome;
      select_dep.appendChild(option);
    });
  })
  .catch(err => {
    console.error("Erro ao carregar setores:", err);
  });
}

carregarSetoresGlobais();
preencherComboGerenciadorDeEstoque();