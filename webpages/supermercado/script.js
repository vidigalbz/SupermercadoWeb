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

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

let userId = getCookie("user");

async function verificUser(){
  fetch("/verific", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({busca: id, column: "userId", tableSelect :"users"})
  }).then( res => res.json())
  .then( data => {
    if (Object.keys(data.mensagem).length === 0){
      window.location.href = '/Error404'
    }
    else {
        document.getElementById('userName').textContent = data.mensagem[0].name;
        document.getElementById('userRole').textContent = "Gerente";
    
        if (userId == "")
          window.location.href = "http://localhost:4000/error403";
        else {
          fetch('/users/' + userId)
            .then(response => response.json())
            .then(data => {
              if (data.status === "success") {
                if (!data.data.gestor){
                  window.location.href = "http://localhost:4000/error403";
                }
              } else {
                console.error("Error:", data.message);
              }
            })
            .catch(error => {
              console.error("Fetch failed:", error);
            });
        }
    }
  }
  )
}

const id = userId;
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

  function carregarSupermercados(){
    
    fetch('/supermercadoData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ busca: JSON.stringify(id)})
    })
    .then(res => res.json())
    .then(data => {
      currentData = data.mensagem;

      renderizarSupermercados(currentData);
    })
  };

function deslogar() {
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    window.location.href = "/login";
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
      return
    }
    total = document.querySelectorAll(".card-super").length;
    contador.innerText = `${total} / 4`;
    
}
carregarSupermercados();