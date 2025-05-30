let categorias;
let departamentos;
let tipoAtual = "Departamento"; // ou "Categoria"

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
    showAlert("Produto não encontrado.", "Erro", "error");
    return;
  }

  document.getElementById("codigo-excluir").value = produto.productId || '';
  document.getElementById("excluir-nome").textContent = produto.name || 'Nome não informado';
  document.getElementById("excluir-codigo").textContent = produto.productId || '—';
  document.getElementById("excluir-categoria").textContent = produto.category || '—';
  document.getElementById("excluir-estoque").textContent = formatarNumero(produto.stock);

  const modal = new bootstrap.Modal(document.getElementById("modalExcluirProduto"));
  modal.show();

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
    preencherCombosEdicao();

    if (!productId) {
      productId = document.getElementById("codigo-editar").value;
    }

    const produto = currentData.find(p => String(p.productId) === String(productId));

    if (!produto) {
      showAlert("Produto não encontrado.", "Erro", "error");
      return;
    }

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

    const modal = new bootstrap.Modal(document.getElementById('modalEditarProduto'));
    modal.show();

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
  if (!valor) {
    showAlert("Informe um valor antes de adicionar.", "Campo obrigatório", "warning");
    return;
  }

  const tipo = tipoAtual === "Departamento" ? "dept" : "cat";

  fetch('/addSetor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: valor, type: tipo })
  })
  .then(res => res.json())
  .then(data => {
    showAlert(data.mensagem || "Adicionado com sucesso!", "Sucesso", "success");
    location.reload()
    document.getElementById("input-novo").value = "";
    atualizarSelectSetores();
  })
  .catch(err => {
    console.error(err);
    showAlert(data.mensagem || "Adicionado com sucesso!", "Sucesso", "success");
    location.reload()
  });
}

  
function excluirDepartamentoCategoria() {
  const select = document.getElementById("select-del");
  const valor = select.value;
  if (!valor) {
    showAlert("Selecione um item para excluir.", "Aviso", "warning");
    return;
  }

  const tipo = tipoAtual === "Departamento" ? "dept" : "cat";

  fetch('/deleteSetor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: valor, type: tipo })
  })
  .then(res => res.json())
  .then(data => {
    showAlert(data.mensagem || "Excluído com sucesso!", "Sucesso", "success");
    atualizarSelectSetores();
    location.reload()
  })
  .catch(err => {
    console.error(err);
    showAlert("Erro ao excluir setor.", "Erro", "error");
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

// Função para calcular dias até a validade
function diasParaVencer(dataValidade) {
  if (!dataValidade) return Infinity;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const valDate = new Date(dataValidade);
  valDate.setHours(0, 0, 0, 0);
  
  const diffTime = valDate - hoje;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Função principal para atualizar alertas
async function atualizarAlertas() {
  try {
    // Mostrar estado de carregamento
    const reloadBtn = document.getElementById('btn-reload-alerts');
    const reloadIcon = reloadBtn.querySelector('i');
    reloadIcon.classList.add('rotate-animation');
    
    // Buscar todos os produtos
    const response = await fetch('/estoqueData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketId: id
})
    });
    
    const data = await response.json();
    const produtos = data.mensagem;
    
    // Filtrar produtos por nível de estoque
    const alertasEstoque = {
      vermelho: produtos.filter(p => p.stock < LIMITES_ESTOQUE.critico),
      laranja: produtos.filter(p => p.stock >= LIMITES_ESTOQUE.critico && p.stock < LIMITES_ESTOQUE.medio),
      amarelo: produtos.filter(p => p.stock >= LIMITES_ESTOQUE.medio && p.stock < LIMITES_ESTOQUE.semnecessidade)
    };
    
    // Filtrar produtos por validade
    const alertasValidade = {
      vermelho: produtos.filter(p => {
        const dias = diasParaVencer(p.expirationDate);
        return dias < LIMITES_VALIDADE.vencido;
      }),
      laranja: produtos.filter(p => {
        const dias = diasParaVencer(p.expirationDate);
        return dias >= LIMITES_VALIDADE.vencido && dias <= LIMITES_VALIDADE.urgente;
      }),
      amarelo: produtos.filter(p => {
        const dias = diasParaVencer(p.expirationDate);
        return dias > LIMITES_VALIDADE.urgente && dias <= LIMITES_VALIDADE.aviso;
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
    alert('Erro ao carregar alertas. Tente novamente.');
  } finally {
    // Remover animação independente de sucesso ou erro
    const reloadIcon = document.querySelector('#btn-reload-alerts i');
    setTimeout(() => {
      reloadIcon.classList.remove('rotate-animation');
    }, 500);
  }
}

// Funções auxiliares para atualizar as seções de alertas
function atualizarAlertasEstoque(alertasEstoque) {
  const container = document.getElementById('alertas-unidades');
  container.innerHTML = '';
  
  alertasEstoque.vermelho.forEach(produto => {
    container.appendChild(criarAlertaEstoque(produto, 'vermelho', `Crítico: menos de ${LIMITES_ESTOQUE.critico} unidades`));
  });
  
  alertasEstoque.laranja.forEach(produto => {
    container.appendChild(criarAlertaEstoque(produto, 'laranja', `Atenção: ${LIMITES_ESTOQUE.critico}-${LIMITES_ESTOQUE.medio-1} unidades`));
  });
  
  alertasEstoque.amarelo.forEach(produto => {
    container.appendChild(criarAlertaEstoque(produto, 'amarelo', `Observação: ${LIMITES_ESTOQUE.medio}-${LIMITES_ESTOQUE.semnecessidade-1} unidades`));
  });
}

function atualizarAlertasValidade(alertasValidade) {
  const container = document.getElementById('alertas-validade');
  container.innerHTML = '';
  
  alertasValidade.vermelho.forEach(produto => {
    const dias = diasParaVencer(produto.expirationDate);
    container.appendChild(criarAlertaValidade(produto, dias, 'vermelho', 'Vencido!'));
  });
  
  alertasValidade.laranja.forEach(produto => {
    const dias = diasParaVencer(produto.expirationDate);
    container.appendChild(criarAlertaValidade(produto, dias, 'laranja', 'Vence em breve'));
  });
  
  alertasValidade.amarelo.forEach(produto => {
    const dias = diasParaVencer(produto.expirationDate);
    container.appendChild(criarAlertaValidade(produto, dias, 'amarelo', 'Validade próxima'));
  });
}

// Funções para criar os cards de alerta
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

function criarAlertaValidade(produto, dias, tipo, titulo) {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  
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
  
  // Configurar o botão de recarregar
  document.getElementById('btn-reload-alerts').addEventListener('click', atualizarAlertas);
  
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