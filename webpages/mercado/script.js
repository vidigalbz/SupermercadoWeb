function selecionarMercado(nome) {
    document.getElementById('titulo-mercado').innerText = nome;

    // Atualiza info
    document.getElementById('nome-mercado-info').innerText = nome;
    document.getElementById('endereco-mercado-info').innerText = "Rua Exemplo, 123";
    document.getElementById('status-mercado-info').innerText = "Operando normalmente";

    // Exibe detalhes
    document.getElementById('mercado-detalhes').classList.remove('d-none');
    document.getElementById('sem-mercado-selecionado').classList.add('d-none');

    // Reseta funcionários
    funcionarios = [];
    renderizarFuncionarios();
}
function editarInformacoes() {
    alert("Função de edição em construção...");
}

function excluirMercado() {
    if (confirm("Deseja realmente excluir este mercado?")) {
        //alert("Mercado excluído!");
        document.getElementById('titulo-mercado').innerText = "Selecione um mercado";
        document.getElementById('sem-mercado-selecionado').classList.remove('d-none');
        document.getElementById('mercado-detalhes').classList.add('d-none');
        funcionarios = [];
        renderizarFuncionarios();
    }
}

function irParaTela(tela) {
    //alert("Indo para tela: " + tela);
    // Aqui pode ir um `window.location.href =` futuramente
}

let funcionarios = [
    { nome: "Ana Silva", online: true, tela: "PDV" },
    { nome: "João Pedro", online: false, tela: null },
    { nome: "Maria Oliveira", online: true, tela: "Estoque" },
];

function renderizarFuncionarios() {
    const lista = document.getElementById('lista-funcionarios');
    lista.innerHTML = ''; // limpa a lista

    if (funcionarios.length === 0) {
        lista.innerHTML = '<li class="list-group-item text-muted">Nenhum funcionário cadastrado.</li>';
        return;
    }

    funcionarios.forEach(func => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';

        // Estilo para online/offline
        if (func.online) {
            item.classList.add('list-group-item-success');
        }

        // Conteúdo
        item.innerHTML = `
      <div>
        <strong>${func.nome}</strong>
        ${func.online ? `<span class="badge bg-success ms-2">Online</span>` : ''}
      </div>
      <small class="text-muted">${func.online ? `Na tela: ${func.tela}` : 'Offline'}</small>
    `;

        lista.appendChild(item);
    });
}