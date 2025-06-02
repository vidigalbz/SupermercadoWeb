let funcionarios = [
    { nome: "Ana Silva", online: true, tela: "PDV", foto: "https://randomuser.me/api/portraits/women/1.jpg", permissoes: ["Estoque", "PDV"] },
    { nome: "João Pedro", online: false, tela: null, foto: "https://randomuser.me/api/portraits/men/2.jpg", permissoes: ["Relatórios"] },
    { nome: "Maria Oliveira", online: true, tela: "Estoque", foto: "https://randomuser.me/api/portraits/women/3.jpg", permissoes: ["Estoque", "Alertas"] },
];

function selecionarMercado(nome) {
    document.getElementById('nome-mercado-info').innerText = nome;
    document.getElementById('endereco-mercado-info').innerText = "Rua Exemplo, 123";
    document.getElementById('sem-mercado-selecionado').classList.add('d-none');
    document.getElementById('mercado-detalhes').classList.remove('d-none');
    renderizarFuncionarios();
}

function irParaTela(tela) {
    //alert("Indo para tela: " + tela);
}

function renderizarFuncionarios() {
    const lista = document.getElementById('lista-funcionarios');
    lista.innerHTML = '';

    if (funcionarios.length === 0) {
        lista.innerHTML = '<li class="list-group-item text-muted">Nenhum funcionário cadastrado.</li>';
        return;
    }

    funcionarios.forEach((func, idx) => {
        const permissoesHtml = func.permissoes && func.permissoes.length
            ? func.permissoes.map(p => `<span class="badge bg-primary me-1">${p}</span>`).join(' ')
            : '<span class="text-muted">Nenhuma</span>';

        const popoverContent = `
                <div class="text-center mb-2">
                    <img src="${func.foto || 'https://via.placeholder.com/64'}" class="rounded-circle mb-2" width="64" height="64">
                    <div class="fw-bold mt-1">${func.nome}</div>
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
                    <img src="${func.foto || 'https://via.placeholder.com/32'}" alt="Foto de ${func.nome}" class="rounded-circle me-2" width="32" height="32">
                    <strong>${func.nome}</strong>
                </div>
                <div class="d-flex align-items-center gap-2 ms-auto">
                    <span class="badge bg-light text-dark border me-2">${func.tela || 'Nenhuma'}</span>
                    <button class="btn btn-sm btn-info" 
                        data-bs-toggle="popover"
                        data-bs-html="true"
                        data-bs-content="${popoverContent}"
                        title="Informações de ${func.nome}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" title="Editar" onclick="abrirModalEditarFuncionario(${idx})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            `;

        lista.appendChild(item);
    });

    // Inicializa popovers após inserir os elementos
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.forEach(function (popoverTriggerEl) {
        new bootstrap.Popover(popoverTriggerEl, { trigger: 'focus', placement: 'left' });
    });
}

// Função para alternar seleção visual dos cards de permissão
function toggleCardSelecionado(card) {
    const checkbox = card.querySelector('input[type=checkbox]');
    checkbox.checked = !checkbox.checked;
    card.classList.toggle('card-selecionado', checkbox.checked);
}

// Ativa o clique nos cards de permissão dos dois modais
document.addEventListener('DOMContentLoaded', function () {
    // Adicionar Funcionário
    document.querySelectorAll('#modalAdicionarFuncionario .card-acesso').forEach(card => {
        card.addEventListener('click', function () {
            toggleCardSelecionado(card);
        });
    });
    // Editar Funcionário
    document.querySelectorAll('#modalEditarFuncionario .card-acesso').forEach(card => {
        card.addEventListener('click', function () {
            toggleCardSelecionado(card);
        });
    });
});

// Ao abrir o modal de editar, marque visualmente os cards já selecionados
function abrirModalEditarFuncionario(idx) {
    const func = funcionarios[idx];
    document.getElementById('tituloEditarFuncionario').innerText = `Editar Funcionário: ${func.nome}`;
    const permissoes = func.permissoes || [];
    document.querySelectorAll('#modalEditarFuncionario .card-acesso').forEach(card => {
        const input = card.querySelector('input[type=checkbox]');
        const nomePermissao = card.getAttribute('data-permissao');
        input.checked = permissoes.includes(nomePermissao);
        card.classList.toggle('card-selecionado', input.checked);
    });
    new bootstrap.Modal(document.getElementById('modalEditarFuncionario')).show();
}

// Se quiser o mesmo para o modal de adicionar, limpe seleção ao abrir:
document.getElementById('modalAdicionarFuncionario').addEventListener('show.bs.modal', function () {
    document.querySelectorAll('#modalAdicionarFuncionario .card-acesso').forEach(card => {
        const input = card.querySelector('input[type=checkbox]');
        input.checked = false;
        card.classList.remove('card-selecionado');
    });
});

// Função para criar dinamicamente o card de supermercado
function criarCardSupermercado({ nome, endereco, icone = "🏪", aoSelecionar }) {
    // Exemplo de uso:
    // const card = criarCardSupermercado({
    //     nome: "Mercado Central",
    //     endereco: "Rua Exemplo, 123",
    //     icone: "🏬",
    // });

    // Cria o elemento principal do card
    const card = document.createElement('div');
    card.className = "card shadow mb-2 card-mercado d-flex flex-row align-items-center px-2 py-1";
    card.style.borderRadius = "10px";

    // Emoji do supermercado
    const emoji = document.createElement('span');
    emoji.className = "fs-2 me-3";
    emoji.textContent = icone;

    // Container para nome e botão
    const container = document.createElement('div');
    container.className = "flex-grow-1 d-flex align-items-center";

    // Nome do supermercado
    const nomeSpan = document.createElement('span');
    nomeSpan.className = "fw-semibold";
    nomeSpan.style.flex = "1";
    nomeSpan.style.textAlign = "left";
    nomeSpan.textContent = nome;

    // Botão selecionar
    const btn = document.createElement('button');
    btn.className = "btn btn-outline-primary btn-sm fw-bold w-100 ms-3";
    btn.textContent = "Selecionar";
    btn.onclick = aoSelecionar;

    // Monta a estrutura
    container.appendChild(nomeSpan);
    container.appendChild(btn);
    card.appendChild(emoji);
    card.appendChild(container);

    //document.querySelector('.mercados-lista .overflow-auto').appendChild(card);
}
