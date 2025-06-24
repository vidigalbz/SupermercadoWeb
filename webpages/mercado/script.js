let funcionarios = [
  { nome: "Ana Silva", online: true, tela: "PDV", foto: "https://randomuser.me/api/portraits/women/1.jpg", permissoes: ["Estoque", "PDV"] },
  { nome: "João Pedro", online: false, tela: null, foto: "https://randomuser.me/api/portraits/men/2.jpg", permissoes: ["Relatórios"] },
  { nome: "Maria Oliveira", online: true, tela: "Estoque", foto: "https://randomuser.me/api/portraits/women/3.jpg", permissoes: ["Estoque", "Alertas"] },
];

const container = document.querySelector('.mercados-lista .overflow-auto');
let currentData = [];
const urlLocal = getBaseUrl();
let userId = getCookie("user");
let idMarket = null;
let total = 0;
const contador = document.getElementById("contador-mercados");

let edicaoAtual = null;
let mercadoSelecionado = null;

function getBaseUrl() {
  try {
    const protocolo = window.location.protocol;
    const host = window.location.host;
    return protocolo + '//' + host;
  } catch (e) {
    console.error(e);
    return "";
  }
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

async function verificarUser() {
  try {
    if (!userId) {
          window.location.href = "/error403";
          return;
    }
    const res = await fetch('/api/usuarios/users/' + userId);
    const data = await res.json();

    console.log(data);
    document.getElementById('userName').textContent = data.data.name;
    document.getElementById('userRole').textContent = "Gerente";

    if (data.status === "success" && !data.data.gestor) {
      window.location.href = "/error403";
    }
  } catch (err) {
    console.error("Erro ao verificar usuário:", err);
    window.location.href = "/error403";
  }
}

function showToast(message, type = 'info') {
  const toastEl = document.getElementById('liveToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');

  const tipos = {
    success: { bg: 'bg-success text-white', icon: '✔️', title: 'Sucesso' },
    error:   { bg: 'bg-danger text-white',  icon: '❌', title: 'Erro' },
    warning: { bg: 'bg-warning text-dark',  icon: '⚠️', title: 'Aviso' },
    info:    { bg: 'bg-info text-dark',     icon: 'ℹ️', title: 'Informação' }
  };
  const config = tipos[type] || tipos.info;

  toastTitle.innerHTML    = `${config.icon} ${config.title}`;
  toastMessage.textContent = message;
  toastEl.className = `toast align-items-center text-white ${config.bg} border-0`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
  setTimeout(() => toast.hide(), 5000);
}

function criarCardSupermercado(supermercado) {
  const card = document.createElement('div');
  card.className = 'card text-center shadow mb-2';
  card.setAttribute('data-id', supermercado.id);

  card.innerHTML = `
    <div class="card-header bg-primary text-white">
      <h1>${supermercado.icone}</h1>
    </div>
    <div class="card-body">
      <div class="d-flex justify-content-start align-items-center mb-3">
        <h5 class="card-title mb-0">${supermercado.nome}</h5>
      </div>
      <button class="btn btn-outline-primary btn-sm fw-bold w-100 selecionar-btn">
        Selecionar
      </button>
    </div>
  `;

  card.querySelector('.selecionar-btn').addEventListener('click', () => {
    selecionarMercado({
      id: supermercado.id,
      nome: supermercado.nome,
      local: supermercado.local,
      icone: supermercado.icone
    });
  });

  container.appendChild(card);
}

function atualizarOuAdicionarCard(supermercado) {
  const seletor = `.card[data-id="${supermercado.marketId}"]`;
  const cardExistente = container.querySelector(seletor);
  if (cardExistente) {
    cardExistente.remove();
  }
  criarCardSupermercado({
    id: supermercado.marketId,
    nome: supermercado.name,
    local: supermercado.local,
    icone: supermercado.icon
  });
}

function renderizarSupermercados(supermercados) {
  container.innerHTML = '';
  if (Array.isArray(supermercados) && supermercados.length > 0) {
    supermercados.forEach(s => atualizarOuAdicionarCard(s));
  }
  atualizarContador();
}

function atualizarContador() {
  total = container.querySelectorAll(".card").length;
  if (contador) {
    contador.innerText = `${total} / 4`;
  }
}

function selecionarMercado({ id, nome, local, icone }) {
  idMarket = id;
  mercadoSelecionado = id;

  document.getElementById('nome-mercado-info').textContent = nome;
  document.getElementById('endereco-mercado-info').textContent = local;

  document.getElementById('sem-mercado-selecionado').classList.add('d-none');
  document.getElementById('mercado-detalhes').classList.remove('d-none');

  const btnEditar = document.querySelector('#mercado-detalhes button[data-bs-target="#modalEditar"]');
  btnEditar.setAttribute('data-id', id);
  btnEditar.setAttribute('data-nome', nome);
  btnEditar.setAttribute('data-local', local);
  btnEditar.setAttribute('data-icone', icone);

  renderizarFuncionarios(id);
}

async function getImageURL(rawImagePath) {
  const response = await fetch('/api/ip');
  const data = await response.json();
  const ip = data.ip;

  return rawImagePath
    ? `http://${ip}:4000/${rawImagePath}`
    : 'https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1';
}

async function renderizarFuncionarios(marketId) {
  const lista = document.getElementById('lista-funcionarios');
  lista.innerHTML = '';

  const res = await fetch('/api/funcionarios/funcionarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ marketId })
  });
  let data = await res.json();
  funcionariosData = data.message;

  document.getElementById("funcionarioCount").textContent = funcionariosData.length;
  funcionarios = [];

  for (i = 0; i < funcionariosData.length; i++){
    userData = await fetch(`/api/usuarios/users/${funcionariosData[i].userId}`);
    user = await userData.json();

    let auxList = [];

    if (funcionariosData[i].pdv) auxList.push("PDV")
    if (funcionariosData[i].estoque) auxList.push("Estoque")
    if (funcionariosData[i].fornecedor) auxList.push("Fornecedores")
    if (funcionariosData[i].relatorios) auxList.push("Relatório")
    if (funcionariosData[i].alertas) auxList.push("Alertas")
    if (funcionariosData[i].rastreamento) auxList.push("Rastreamento")

    user.data["permissoes"] = auxList;
    user.data.profileImage = await getImageURL(user.data.profileImage);

    funcionarios.push(user.data);
    console.log(user.data.profileImage)
    console.log(user.data);
  }

  if (funcionarios.length === 0) {
    lista.innerHTML = '<li class="list-group-item text-muted">Nenhum funcionário cadastrado.</li>';
    return;
  }

  funcionarios.forEach(async (func, idx) => {
    console.log(func)
    const permissoesHtml = func.permissoes && func.permissoes.length
      ? func.permissoes.map(p => `<span class="badge bg-primary me-1">${p}</span>`).join(' ')
      : '<span class="text-muted">Nenhuma</span>';

    const popoverContent = `
      <div class="text-center mb-2">
        <img src="${func.profileImage || 'https://via.placeholder.com/64'}" class="rounded-circle mb-2" width="64" height="64">
        <div class="fw-bold mt-1">${func.name}</div>
      </div>
      <div><strong>Status:</strong> ${func.online ? '<span class="text-success">Online</span>' : '<span class="text-secondary">Offline</span>'}</div>
      <div><strong>Tela:</strong> ${func.tela || '<span class="text-muted">Nenhuma</span>'}</div>
      <div><strong>Permissões:</strong> ${permissoesHtml}</div>
    `.replace(/"/g, '&quot;').replace(/\n/g, '');

    const item = document.createElement('li');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';

    if (func.online) item.classList.add('list-group-item-success');

    item.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${func.profileImage || 'https://via.placeholder.com/32'}" alt="Foto de ${func.name}" class="rounded-circle me-2" width="32" height="32">
        <strong>${func.name}</strong>
      </div>
      <div class="d-flex align-items-center gap-2 ms-auto">
        <span class="badge bg-light text-dark border me-2">${func.tela || 'Nenhuma'}</span>
        <button class="btn btn-sm btn-info" 
          data-bs-toggle="popover"
          data-bs-html="true"
          data-bs-content="${popoverContent}"
          title="Informações de ${func.name}">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-warning" title="Editar" onclick="abrirModalEditarFuncionario(${idx})">
          <i class="bi bi-pencil"></i>
        </button>
      </div>
    `;

    lista.appendChild(item);
  });

  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.forEach(el => new bootstrap.Popover(el, { trigger: 'focus', placement: 'left' }));
}

function toggleCardSelecionado(card) {
  const checkbox = card.querySelector('input[type=checkbox]');
  checkbox.checked = !checkbox.checked;
  card.classList.toggle('card-selecionado', checkbox.checked);
}

function abrirModalEditarFuncionario(idx) {
  const func = funcionarios[idx];
  edicaoAtual = idx;

  document.getElementById('tituloEditarFuncionario').textContent = `Editar Funcionário: ${func.name}`;
  const permissoes = func.permissoes || [];
  document.querySelectorAll('#modalEditarFuncionario .card-acesso').forEach(card => {
    const input = card.querySelector('input[type=checkbox]');
    const nomePermissao = card.getAttribute('data-permissao');
    input.checked = permissoes.includes(nomePermissao);
    card.classList.toggle('card-selecionado', input.checked);
  });
  new bootstrap.Modal(document.getElementById('modalEditarFuncionario')).show();
}

async function adicionarFuncionario() {

  let funcionarioInput = document.getElementById("cargoFuncionario");

  const permissoesSelecionadas = Array.from(
    document.querySelectorAll('#modalAdicionarFuncionario .card-acesso')
  ).filter(card => {
    const input = card.querySelector('input[type=checkbox]');
    return input.checked;
  }).map(card => card.getAttribute('data-permissao'));

  let permissionsBoolList = [];
  permissionsBoolList.push(permissoesSelecionadas.includes("PDV") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Estoque") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Fornecedores") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Relatório") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Alertas") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Rastreamento") ? 1 : 0);

  let func = {userId: funcionarioInput.value, permissoes: permissionsBoolList}

  let res = await fetch('/api/funcionarios/atualizarFuncionario', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "insert", userData: func, marketId: mercadoSelecionado})
      });
  data = await res.json();
  /*TODO:
    Popup para Feedback de Adição de Usuário!
    data.message contém a mensagem (ok, erro, usuário já cadastrado....)
    Fechar modal de usuário
  */
 renderizarFuncionarios(mercadoSelecionado);
}

async function SalvarPermissoes() {
  let func = funcionarios[edicaoAtual];
  let permissionsBoolList = [];

  const permissoesSelecionadas = Array.from(
    document.querySelectorAll('#modalEditarFuncionario .card-acesso')
  ).filter(card => {
    const input = card.querySelector('input[type=checkbox]');
    return input.checked;
  }).map(card => card.getAttribute('data-permissao'));

  permissionsBoolList.push(permissoesSelecionadas.includes("PDV") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Estoque") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Fornecedores") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Relatório") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Alertas") ? 1 : 0);
  permissionsBoolList.push(permissoesSelecionadas.includes("Rastreamento") ? 1 : 0);

  console.log(func);

  func.permissoes = permissionsBoolList;

  fetch("/api/funcionarios/atualizarFuncionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "update", userData: func, marketId: mercadoSelecionado})
      });
  /*
    TODO:
    Popup para Feedback de Alteração nas permissões de usuário!
  */
 renderizarFuncionarios(mercadoSelecionado);
}

async function RemoverFuncionario(){
  let func = funcionarios[edicaoAtual];
  fetch("/api/funcionarios/atualizarFuncionario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({type: "delete", userData: func, marketId: mercadoSelecionado})
  })
  /*
    TODO:
    Popup para Feedback de remoção de Usuário!
  */
  renderizarFuncionarios(mercadoSelecionado);
}

function irParaTela(tela) {
  alert("Indo para tela: " + tela);
}

function carregarSupermercados() {
  fetch('/api/supermercados/supermercadoData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ busca: userId })
  })
    .then(res => res.json())
    .then(data => {
      currentData = data.mensagem || [];
      renderizarSupermercados(currentData);
    })
    .catch(err => {
      console.error("Erro ao carregar mercados:", err);
      showToast("Falha ao buscar mercados", "error");
    });
}

document.addEventListener('DOMContentLoaded', () => {
  verificarUser();
  carregarSupermercados();

  document.querySelectorAll('.toast').forEach(el => new bootstrap.Toast(el));
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(p => {
    const content = p.getAttribute("data-bs-content")?.replace(/\n/g, "<br>") || '';
    new bootstrap.Popover(p, { html: true, content });
  });

  document.querySelectorAll('#modalAdicionarFuncionario .card-acesso').forEach(card => {
    card.addEventListener('click', () => toggleCardSelecionado(card));
  });

  document.querySelectorAll('#modalEditarFuncionario .card-acesso').forEach(card => {
    card.addEventListener('click', () => toggleCardSelecionado(card));
  });

  document.getElementById('modalAdicionarFuncionario').addEventListener('show.bs.modal', () => {
    document.querySelectorAll('#modalAdicionarFuncionario .card-acesso').forEach(card => {
      const input = card.querySelector('input[type=checkbox]');
      input.checked = false;
      card.classList.remove('card-selecionado');
    });
  });

  document.getElementById("addMarket").addEventListener("click", e => {
    e.preventDefault();
    if (total >= 4) {
      showToast("Alcançou o limite de 4 mercados", "error");
      return;
    }
    const nome = document.getElementById("nomeSupermercado").value.trim();
    const local = document.getElementById("localizacao").value.trim();
    const icon = document.getElementById("icon").value.trim();

    if (!nome || !local || !icon) {
      showToast("Preencha todos os campos para adicionar", "warning");
      return;
    }

    fetch('/api/supermercados/adicionarSupermercado', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, local, ownerId: userId, icon })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          carregarSupermercados();
          bootstrap.Modal.getInstance(document.getElementById('modalAdicionar')).hide();
        } else if (data.erro) {
          showToast(data.erro, "error");
        } else {
          showToast("Erro ao adicionar mercado", "error");
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Erro ao conectar com o servidor!", "error");
      });
  });

  document.getElementById("SalvarUpdate").addEventListener("click", async e => {
    e.preventDefault();
    const inputSuper = document.getElementById("SupermercadoUpdate");
    const inputLocal = document.getElementById("LocalUpdate");
    const inputIcon = document.getElementById("IconUpdate");

    if (!idMarket) {
      showToast("Nenhum mercado selecionado para editar", "warning");
      return;
    }

    await fetch('/api/supermercados/updateSupermercado', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: idMarket,
        nome: inputSuper.value.trim(),
        local: inputLocal.value.trim(),
        icon: inputIcon.value.trim(),
        ownerId: userId
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          carregarSupermercados();
        } else {
          showToast("Falha ao atualizar mercado", "error");
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Erro na requisição de atualização", "error");
      });
  });

  document.getElementById("excluirMercado").addEventListener("click", async e => {
    e.preventDefault();
    const confirma = document.getElementById("confirmarExclusao").value.trim();

    if (!idMarket) {
      showToast("Nenhum mercado selecionado para excluir", "warning");
      return;
    }

    try {
      const res = await fetch("/api/supermercados/deletarSupermercado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: idMarket, ownerId: userId})
      });
      const result = await res.json();
      if (res.ok && result.mensagem) {
        showToast(result.mensagem, "success");
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        carregarSupermercados();
        document.getElementById('mercado-detalhes').classList.add('d-none');
        document.getElementById('sem-mercado-selecionado').classList.remove('d-none');
        idMarket = null;
      } else {
        showToast(`Erro ao excluir: ${result.erro || "desconhecido"}`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast(`Erro na requisição: ${err.message}`, "error");
    }
  });

  const modalEditar = document.getElementById("modalEditar");
  if (modalEditar) {
    modalEditar.addEventListener('show.bs.modal', event => {
      const botao = event.relatedTarget;
      const id = botao.getAttribute('data-id');
      const nome = botao.getAttribute('data-nome') || '';
      const local = botao.getAttribute('data-local') || '';
      const icone = botao.getAttribute('data-icone') || '';

      document.getElementById("SupermercadoUpdate").value = nome;
      document.getElementById("LocalUpdate").value = local;
      document.getElementById("IconUpdate").value = icone;
      idMarket = id;
      document.getElementById("confirmarExclusao").value = "";
    });
  }

  document.getElementById("btn-recarrega-estoque")?.addEventListener("click", () => {
    window.location.reload();
  });
});

function deslogar() {
  document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
  window.location.href = "/login";
}