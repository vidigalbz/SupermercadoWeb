// Dados do usuário
document.getElementById('userName').textContent = 'João Silva';
document.getElementById('userEnrollment').textContent = '12345';
document.getElementById('userRole').textContent = 'Operador de Caixa';

const permissoesPorLoja = {
    "Loja Centro": {
    estoque: true,
    caixa: true,
    relatorios: true,
    rastreio: false,
    configuracoes: false
    },
    "Loja Norte": {
    estoque: true,
    caixa: false,
    relatorios: false,
    rastreio: false,
    configuracoes: false
    }
};

function selecionarSupermercado(nomeLoja) {
    document.getElementById('nomeLojaSelecionada').textContent = nomeLoja;
    document.getElementById('supermercadoSelect').classList.add('d-none');
    document.getElementById('acessosPanel').classList.remove('d-none');
    atualizarAcessos(permissoesPorLoja[nomeLoja]);
}

function voltarParaSupermercados() {
    document.getElementById('supermercadoSelect').classList.remove('d-none');
    document.getElementById('acessosPanel').classList.add('d-none');
}

function atualizarAcessos(permissoes) {
    toggleCard('cardEstoque', permissoes.estoque);
    toggleCard('cardCaixa', permissoes.caixa);
    toggleCard('cardRelatorios', permissoes.relatorios);
    toggleCard('cardRastreio', permissoes.rastreio);
    toggleCard('cardConfiguracoes', permissoes.configuracoes);
}

function toggleCard(id, habilitado) {
    const card = document.getElementById(id);
    if (habilitado) {
    card.classList.remove('disabled-card');
    } else {
    card.classList.add('disabled-card');
    }
}