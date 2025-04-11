function confirmarExclusao() {
  const input = document.getElementById("confirmarExclusao");
  const nome = "Supermercado A"; // Substituir pelo nome atual
  if (input.value === nome) {
    alert("Supermercado excluído!");
    // lógica real de exclusão aqui
  } else {
    alert("Nome incorreto. Exclusão cancelada.");
  }
}

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
  deleteEmpty(0)
  const card = document.createElement('div');
  card.className = 'col-md-4 col-lg-3';
  card.innerHTML = `
    <div class="card card-super h-100">
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

// CADASTRO
document.getElementById("addMarket").addEventListener("click", function (e){
  e.preventDefault();
  var name = document.getElementById("nomeSupermercado").value;
  var local = document.getElementById("localizacao").value;
  var gerente = document.getElementById("nomeGerente").value;
  var icon =  document.getElementById("icon").value;
  
  fetch('/adicionarSupermercado', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({nome: name, local: local, onwerId: gerente, icon: icon})
  })
  .then(res => res.json()
  .then(data => {
    if (data.status === "sucess"){
      showToast("Supermercado Adicionado com sucesso", "sucess");
      criarCardSupermercado({
        nome: nome,
        local: local,
        icone: icon,
        linkPDV: 'https://pdv.link',
        linkEstoque: 'https://estoque.link'
      });
    } else {
      showToast(data.message || "Erro ao adicionar supermercado", "danger");
    }
  })
  .catch(() => showToast("Erro ao conectar com servidor!", "danger")),
)})

criarCardSupermercado({
  nome: 'Supermercado A',
  local: 'Xique Xique Bahia',
  icone: '🏪',
  linkPDV: 'https://pdv.link',
  linkEstoque: 'https://estoque.link'
});
