const user = JSON.parse(localStorage.getItem("user"));
const container = document.getElementById("supermercado-container")
let currentData = []

function showToast(message, color = 'danger') {
  const toast = document.getElementById('liveToast');
  const toastMessage = document.getElementById('toastMessage');

  toast.className = `toast align-items-center text-white bg-${color} border-0`;
  toastMessage.textContent = message;

  const toastBootstrap = new bootstrap.Toast(toast);
  toastBootstrap.show();
}

document.addEventListener('DOMContentLoaded', function() {
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');

  if (userName) document.getElementById('userName').textContent = userName;
  if (userEmail) document.getElementById('userEmail').textContent = userEmail;
  if (userRole) document.getElementById('userRole').textContent = userRole;
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
  
  const contador = document.getElementById("contadorSupermercados");
  const total = document.querySelectorAll(".card-super").length;
  console.log(total)
  contador.innerText = `${total} / 4`;
  const box = contador.parentElement;
  
  if (total === 5) {
    box.classList.add("maximo");
  } else if (total >= 3) {
    box.classList.add("alerta");
  }
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
    card.className = 'col-md-4 col-lg-3';
    card.innerHTML = `
    <div  class="card-super h-100" data-id="${supermercado.marketId}">
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
    <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#modalEditar">
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
    
    // Adiciona o card na área onde os cards ficam
    document.querySelector('.card-container').appendChild(card);
    
    // Ativa popovers do Bootstrap nesse card
    const popoverTriggerList = card.querySelectorAll('[data-bs-toggle="popover"]');
    popoverTriggerList.forEach(el => new bootstrap.Popover(el));
  }
  
  function deleteEmpty(index) {
    let card = document.getElementById(`empty-card-${index}`)
    card.remove();
  }
  function atualizarOuAdicionarCard(supermercado) {
    console.log(currentData)
    const cardExistente = container.querySelector(`.card-super[data-id="${supermercado.marketId}"]`);
    if (cardExistente) {
      cardExistente.remove();
    }
    criarCardSupermercado({
      nome: supermercado.name,
      local: supermercado.local,
      ownerId: supermercado.ownerId,
      icone: supermercado.icon}
    );
  }
  
  function renderizarSupermercados(supermercados) {
    console.log(supermercados?.map(s => s.marketId) || "nao");
    const idsNovos = supermercados.map(s => s.marketId);
    const cardsAtuais = Array.from(container.querySelectorAll('.card-super'));
    
    for (let card of cardsAtuais) {
      if (!idsNovos.includes(parseInt(card.dataset.id))) {
        card.remove();
      }
    }
    for (let supermercado of supermercados) {
      atualizarOuAdicionarCard(supermercado);
    }
  }
  function carregarSupermercados(){
    
    fetch('/supermercadoData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ busca: JSON.stringify(user.userId)})
    })
    .then(res => res.json())
    .then(data => {
      currentData = data.mensagem;
      console.log(currentData)
      renderizarSupermercados(currentData);
    })
  };
    // CADASTRO
document.getElementById("addMarket").addEventListener("click", function(e){
  e.preventDefault();
  const name = document.getElementById("nomeSupermercado").value;
  const local = document.getElementById("localizacao").value;
  const ownerId = user.userId;
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
    } else {
      showToast(data.message || "Erro ao adicionar supermercado", "danger");
    }
  })
  .catch(err => {
    console.error(err);
    showToast("Erro ao conectar com servidor!", "danger");
  });
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
          body: JSON.stringify({ name: nome})
        })
        
        const result = await res.json();
        console.log(result)
        
        if (res.ok) {
        alert("Supermercado excluído!");
        carregarSupermercados();
        }
        else{
          console.log("Erro ao excluir produto " + (result.erro || "Erro desconhecido"))
        }
      }
      catch (err){
        console.log("Erro na requisição " + err.message)
      }
    }}
  });
carregarSupermercados();