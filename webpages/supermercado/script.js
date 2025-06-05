const container = document.getElementById("supermercado-container")
let currentData = []
const urlNow = window.location.href;
const urlLocal = getUrl(); // ← será preenchido corretamente
var dataUser;

function getUrl() {
  try{
    const protocolo = window.location.protocol;
    const host = window.location.host;           
    const baseUrl = protocolo + '//' + host;      

    return baseUrl
  }
  catch(e){
    console.log(e)
  }
}

function getQueryParam(paramName) {
  const queryString = window.location.search.substring(1);
  const params = queryString.split('&');

  for (const param of params) {
    const [key, value] = param.split('=');
    if (key === paramName) {
      return decodeURIComponent(value || '');
    }
  }
  return null;
}

async function verificUser() {
    const userIdFromUrl = getQueryParam('userID'); // Pega o userID da URL

    if (!userIdFromUrl) {
        console.error("userID não encontrado na URL para verificUser.");
        document.getElementById('userName').textContent = "Usuário Desconhecido";
        document.getElementById('userEmail').textContent = "-";
        document.getElementById('userRole').textContent = "-";
        // Considere redirecionar para uma página de erro ou login se o userID for essencial
        // window.location.href = '/login'; // Exemplo
        return;
    }

    try {
        const response = await fetch("/api/getUserDetails", { // Chama a nova rota
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userIdFromUrl }) // Envia o userId corretamente
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Erro HTTP ${response.status}` }));
            throw new Error(errorData.error || `Erro ${response.status} ao buscar dados do usuário.`);
        }

        const data = await response.json();

        if (data.success && data.mensagem && data.mensagem.length > 0) {
            const userInfo = data.mensagem[0];
            document.getElementById('userName').textContent = userInfo.name || "Nome não disponível";
            document.getElementById('userEmail').textContent = userInfo.email || "Email não disponível";
            document.getElementById('userRole').textContent = "Gerente"; // Defina o cargo como necessário
        } else {
            console.error("Usuário não encontrado ou resposta inválida do servidor:", data.error || "Dados de usuário não retornados.");
            // Decide o que fazer se o usuário não for encontrado (ex: redirecionar)
            document.getElementById('userName').textContent = "Usuário Inválido";
            // window.location.href = '/Error404'; // Exemplo
        }
    } catch (err) {
        console.error("Erro na função verificUser:", err);
        document.getElementById('userName').textContent = "Erro ao carregar";
        document.getElementById('userEmail').textContent = "-";
        document.getElementById('userRole').textContent = "-";
        // Exibir uma notificação de erro para o usuário também seria uma boa prática
        // showToast(`Erro ao carregar dados do usuário: ${err.message}`, 'error');
    }
}

const id = getQueryParam('userID');
verificUser()

var inputSuper = document.getElementById("SupermercadoUpdate") // Pegando os input da tela de Update
var inputLocal = document.getElementById("LocalUpdate")
var inputIcon = document.getElementById("IconUpdate")
var idMarket;

var total;
const contador = document.getElementById("contadorSupermercados");

function showToast(message, type = 'info') {
  const toastEl = document.getElementById('liveToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  
  // Configura cores e ícones baseados no tipo
  const tipos = {
    success: { 
      bg: 'bg-success text-white', 
      icon: '✔️',
      title: 'Sucesso'
    },
    error: { 
      bg: 'bg-danger text-white', 
      icon: '❌',
      title: 'Erro'
    },
    warning: { 
      bg: 'bg-warning text-dark', 
      icon: '⚠️',
      title: 'Aviso'
    },
    info: { 
      bg: 'bg-info text-dark', 
      icon: 'ℹ️',
      title: 'Informação'
    }
  };
  
  const config = tipos[type] || tipos.info;
  
  // Atualiza o toast
  toastTitle.innerHTML = `${config.icon} ${config.title}`;
  toastMessage.textContent = message;
  
  // Remove classes anteriores e adiciona as novas
  toastEl.className = `toast align-items-center text-white ${config.bg} border-0`;
  
  // Mostra o toast
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
  
  // Esconde automaticamente após 5 segundos
  setTimeout(() => toast.hide(), 5000);
}

document.addEventListener('DOMContentLoaded', function() {
  // Inicializa todos os toasts
  const toastElList = [].slice.call(document.querySelectorAll('.toast'));
  toastElList.map(function(toastEl) {
    return new bootstrap.Toast(toastEl);
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
  popovers.forEach(p => {
    const content = p.getAttribute("data-bs-content").replace(/\n/g, "<br>");
    new bootstrap.Popover(p, {
      html: true,
      content: content
    });
  });
});

function copiarLink(btn) {
  const input = btn.parentElement.querySelector('input');
  input.type = 'text';
  input.select();
  document.execCommand('copy');
  input.type = 'password';
}

function alternarVisibilidade(botao) {
  const input = botao.parentElement.querySelector('input');
  const icone = botao.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
        icone.classList.remove('bi-eye-slash');
        icone.classList.add('bi-eye');
      } else {
        input.type = 'password';
        icone.classList.remove('bi-eye');
        icone.classList.add('bi-eye-slash');
      }
    }
    
    function criarCardSupermercado(supermercado) {
      const card = document.createElement('div');
      card.className = 'col';
      card.innerHTML = `
      <div class="card card-super h-100" data-id="${supermercado.id}">
          <div class="card-img-top text-center py-4 bg-primary text-white">
              <span class="fs-1">${supermercado.icone}</span>
          </div>
          <div class="card-body">
              <h5 class="card-title mb-3">${supermercado.nome}</h5>
              <div class="d-flex justify-content-between mb-2">
                  <button class="btn btn-outline-info btn-sm" data-bs-toggle="popover" title="Detalhes do Supermercado"
                  data-bs-html="true"
                  data-bs-content="
                  <strong>Nome:</strong> ${supermercado.nome}<br>
                  <strong>Local:</strong> ${supermercado.local}
                  ">
                      <i class="bi bi-info-circle"></i>
                  </button>
                  <button class="btn btn-warning btn-sm" 
                    data-bs-toggle="modal" 
                    data-bs-target="#modalEditar"
                    data-id="${supermercado.id}"
                    data-local="${supermercado.local}"
                    data-icone="${supermercado.icone}"
                    data-nome="${supermercado.nome}"
                    >
                      <i class="bi bi-pencil-square"></i>
                  </button>
              </div>
              <label class="form-label">Link PDV:</label>
              <div class="input-group mb-2">
                  <input type="password" class="form-control" value="${supermercado.linkPDV}" readonly>
                  <button class="btn btn-outline-secondary" onclick="copiarLink(this)" title="Copiar">
                      <i class="bi bi-clipboard"></i>
                  </button>
                  <button class="btn btn-outline-secondary" onclick="alternarVisibilidade(this)" title="Mostrar/Ocultar">
                      <i class="bi bi-eye-slash"></i>
                  </button>
              </div>
              <label class="form-label">Link Estoque:</label>
              <div class="input-group">
                  <input type="password" class="form-control" value="${supermercado.linkEstoque}" readonly>
                  <button class="btn btn-outline-secondary" onclick="copiarLink(this)" title="Copiar">
                      <i class="bi bi-clipboard"></i>
                  </button>
                  <button class="btn btn-outline-secondary" onclick="alternarVisibilidade(this)" title="Mostrar/Ocultar">
                      <i class="bi bi-eye-slash"></i>
                  </button>
              </div>
          </div>
      </div>
      `;
  
      container.appendChild(card);
  
      // Ativa popovers do Bootstrap nesse card
      const popoverTriggerList = card.querySelectorAll('[data-bs-toggle="popover"]');
      popoverTriggerList.forEach(el => new bootstrap.Popover(el));
  }
  
  function deleteEmpty(index) {
    let card = document.getElementById(`empty-card-${index}`)
    card.remove();
  }
  function atualizarOuAdicionarCard(supermercado) {
    const cardExistente = container.querySelector(`.card-super[data-id="${supermercado.marketId}"]`);
    if (cardExistente) {
      cardExistente.remove();
    }
    criarCardSupermercado({
      id: supermercado.marketId,
      nome: supermercado.name,
      local: supermercado.local,
      ownerId: supermercado.ownerId,
      icone: supermercado.icon,
      linkPDV:  `${urlLocal}/pdv/?id=${supermercado.marketId}`,
      linkEstoque: `${urlLocal}/estoque/?id=${supermercado.marketId}`
    }
    );
  }
  
  function renderizarSupermercados(supermercados) {
    // Limpa o container antes de renderizar
    container.innerHTML = '';
    
    // Verifica se há supermercados para renderizar
    if (supermercados && supermercados.length > 0) {
        for (let supermercado of supermercados) {
            atualizarOuAdicionarCard(supermercado);
        }
    }
    
    // Atualiza o contador
    count();
  }

function carregarSupermercados() {
    // 'id' já deve ser o userID obtido da URL (ex: "1", "23")
    if (!id) {
        console.error("UserID (id) não está definido para carregar supermercados.");
        container.innerHTML = "<p class='alert alert-danger'>Não foi possível identificar o usuário.</p>";
        return;
    }

    fetch('/supermercadoData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busca: id }) // Envie o 'id' (userID) diretamente
    })
    .then(res => {
        if (!res.ok) {
            // Tenta extrair uma mensagem de erro do JSON, se houver
            return res.json().then(errData => {
                throw new Error(errData.erro || `Erro ${res.status} do servidor.`);
            }).catch(() => { // Se o corpo do erro não for JSON
                throw new Error(`Erro ${res.status} do servidor.`);
            });
        }
        return res.json();
    })
    .then(data => {
        if (data.mensagem) { // O backend retorna os supermercados na chave 'mensagem'
            currentData = data.mensagem;
            renderizarSupermercados(currentData);
        } else if (data.erro) {
            console.error("Erro ao carregar supermercados:", data.erro);
            container.innerHTML = `<p class='alert alert-warning'>${data.erro}</p>`;
            currentData = []; // Limpa dados antigos
            renderizarSupermercados(currentData); // Atualiza a contagem para 0
        } else {
            // Se não tem nem 'mensagem' nem 'erro', a resposta é inesperada
            console.error("Resposta inesperada do servidor:", data);
            container.innerHTML = "<p class='alert alert-warning'>Não foi possível carregar os supermercados. Formato de resposta inesperado.</p>";
            currentData = [];
            renderizarSupermercados(currentData);
        }
    })
    .catch(err => {
        console.error('Erro crítico ao carregar supermercados:', err);
        container.innerHTML = `<p class='alert alert-danger'>Erro crítico ao conectar com o servidor para carregar supermercados: ${err.message}</p>`;
        currentData = []; // Limpa para não mostrar dados antigos em caso de erro
        renderizarSupermercados(currentData); // Atualiza a contagem e interface
    });
}

  document.addEventListener('DOMContentLoaded', function(){ //Carregar os Modal de Acordo com os dados
    const modalEditar = document.getElementById("modalEditar")

    modalEditar.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;

      idMarket = button.getAttribute('data-id')
      const nome = button.getAttribute('data-nome')
      const local = button.getAttribute('data-local')
      const icone = button.getAttribute('data-icone')

      inputSuper.value = nome;
      inputLocal.value = local;
      inputIcon.value = icone;
    })
  })
  document.getElementById("SalvarUpdate").addEventListener("click", async function(e) {
    e.preventDefault();

   await fetch('/updateSupermercado', {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({
        id: idMarket,  
        nome: inputSuper.value,
        local: inputLocal.value,
        icon: inputIcon.value,
      })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        carregarSupermercados()
      }
    })
  })  
    // CADASTRO
document.getElementById("addMarket").addEventListener("click", function(e){
  e.preventDefault();
  const box = contador.parentElement;
  count();
  console.log(total)
  if (total < 4 ){
  const name = document.getElementById("nomeSupermercado").value;
  const local = document.getElementById("localizacao").value;
  const ownerId = id;
  const icon = document.getElementById("icon").value;
  
  fetch('/adicionarSupermercado', {
    method: "POST",
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: name, 
    local: local, 
    ownerId: ownerId, 
    icon: icon
  })})
  .then(res => res.json())
  .then(data => {
    if (data.success){
      carregarSupermercados();
    } else if (data.erro){
      showToast(data.erro, "error")
    } 
    else {
      showToast("Erro ao adicionar supermercado", "error");
    }
  })
  .catch(err => {
    console.error(err);
    showToast("Erro ao conectar com o servidor!", "error");
  });
  }
  else if (total >= 4) {
    showToast("Alcançou o Limite de supermercado", "error")
    box.classList.add("maximo");
  }
  if (total >= 3) {
    box.classList.add("alerta");
  }
});
  
  document.getElementById("excluirMercado").addEventListener("click", async function(e){
    e.preventDefault();{
    const input = document.getElementById("confirmarExclusao");
    const nome = input.value; // Substituir pelo nome atual
    if (input.value === nome) {
      try{
        const res = await fetch("/deletarSupermercado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: idMarket})
        })
        
        const result = await res.json();
        console.log(result)
        
        if (res.ok) {
          showToast(result.mensagem, "success");
          carregarSupermercados();
        }
        else{
          showToast(`Erro ao excluir produto: ${result.erro || "Erro desconhecido"}`, "error");
        }
      }
      catch (err){
        showToast(`Erro na requisição: ${err.message}`, "error");
      }
    }}
  });
function count(){
    if(!contador){
      console.log('Erro no count')
      return
    }
    total = document.querySelectorAll(".card-super").length;
    contador.innerText = `${total} / 4`;
    
}
carregarSupermercados();