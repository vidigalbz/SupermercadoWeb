// Variáveis globais
let graficoAtualABC = null;
let graficoFinanceiro = null;
let relatorioData = null;
let dataExibida = new Date(); // ✅ ESTADO: Controla o mês/ano que estamos vendo

/**
 * Função para buscar um cookie específico pelo seu nome.
 * @param {string} name - O nome do cookie a ser procurado.
 * @returns {string|null} - O valor do cookie ou null se não for encontrado.
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// --- FUNÇÃO PRINCIPAL DE BUSCA E RENDERIZAÇÃO (VERSÃO FINAL) ---
async function buscarERenderizarRelatorio() {
    // 1. Pega o ID do mercado que está salvo no cookie.
    const marketId = getCookie('marketId');

    // 2. Validação: Se não houver um mercado selecionado, exibe uma mensagem clara e interrompe a função.
    if (!marketId) {
        document.body.innerHTML = `<div class="container mt-5">
                                      <div class="alert alert-warning">
                                          <strong>Atenção:</strong> Você precisa selecionar um mercado para ver os relatórios.
                                          <br><br>
                                          <a href="/" class="btn btn-primary">Voltar para a seleção de mercados</a>
                                      </div>
                                   </div>`;
        return; // Para a execução aqui.
    }

    // 3. Bloco try...catch para lidar com possíveis erros de rede ou do servidor.
    try {
        const mes = dataExibida.getMonth();
        const ano = dataExibida.getFullYear();
        
        // 4. ✨ CORREÇÃO PRINCIPAL: A URL foi ajustada para a rota correta e mais organizada do backend.
        const response = await fetch('/api/relatorio/data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ marketId, mes, ano })
        });

        // 5. Validação da resposta: Se a resposta não for bem-sucedida (ex: erro 400, 500), lança um erro.
        if (!response.ok) {
            // Tenta extrair uma mensagem de erro do corpo da resposta JSON.
            const err = await response.json();
            throw new Error(err.error || `Falha ao buscar dados do relatório (Status: ${response.status})`);
        }

        // 6. Processa a resposta bem-sucedida.
        relatorioData = await response.json();

        // 7. Chama todas as funções que atualizam a interface com os novos dados.
        atualizarControlesUI();
        renderizarResumoVendas(relatorioData.vendas);
        renderizarGraficoFinanceiro(relatorioData.desempenhoFinanceiro);
        renderizarGraficoABC(relatorioData.curvaABC);
        renderizarListaVendidos(relatorioData.maisVendidos, "mais");
        renderizarProdutosEncalhados(relatorioData.produtosEncalhados);
        
    } catch (error) {
        // 8. Se qualquer erro for lançado no bloco 'try', ele será capturado e exibido aqui.
        document.body.innerHTML = `<div class="container mt-5"><div class="alert alert-danger"><strong>Erro:</strong> ${error.message}</div></div>`;
    }
}

// --- FUNÇÕES DE CONTROLE DA UI ---
function atualizarControlesUI() {
    const hoje = new Date();
    const tituloEl = document.getElementById("titulo-mes-atual");
    
    const nomeMes = dataExibida.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    tituloEl.textContent = `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}`;

    const btnProximo = document.getElementById('btn-proximo-mes');
    btnProximo.disabled = (dataExibida.getFullYear() >= hoje.getFullYear() && dataExibida.getMonth() >= hoje.getMonth());
}

// --- CONFIGURAÇÃO DOS EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    buscarERenderizarRelatorio();

    document.getElementById('btn-mes-anterior').onclick = () => {
        dataExibida.setMonth(dataExibida.getMonth() - 1);
        buscarERenderizarRelatorio();
    };

    document.getElementById('btn-proximo-mes').onclick = () => {
        dataExibida.setMonth(dataExibida.getMonth() + 1);
        buscarERenderizarRelatorio();
    };
    
    document.getElementById('mais-vendidos-tab').onclick = () => {
        if (relatorioData) renderizarListaVendidos(relatorioData.maisVendidos, "mais");
    };
});

// --- FUNÇÕES DE RENDERIZAÇÃO ---

// ✅ FUNÇÃO ATUALIZADA PARA MOSTRAR OS 3 CARDS
function renderizarResumoVendas(info) {
    if (!info) return;
    
    const formatCurrency = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Mostra os cards de hoje e semana novamente
    document.querySelectorAll('.col-md-4').forEach(card => card.style.display = 'block');

    // Preenche os dados de Hoje
    document.getElementById("qnt-hoje").textContent = formatCurrency(info.hoje[0]);
    document.getElementById("prcn-hoje").textContent = `${info.hoje[1]}% em relação ao dia anterior`;

    // Preenche os dados da Semana
    document.getElementById("qnt-semana").textContent = formatCurrency(info.semana[0]);
    document.getElementById("prcn-semana").textContent = `${info.semana[1]}% em relação à semana anterior`;

    // Preenche os dados do Mês
    document.getElementById("qnt-mes").textContent = formatCurrency(info.mes[0]);
    document.getElementById("prcn-mes").textContent = "Total do Mês";
}

function irParaTela(tela) {
    window.location.href = `${window.location.origin}/${tela}`;
}

function renderizarGraficoFinanceiro(dados) {
    const tituloEl = document.getElementById("titulo-financeiro");
    const canvas = document.getElementById("graficoFinanceiro");
    const ctx = canvas.getContext('2d');
    
    const nomeMes = dataExibida.toLocaleString('pt-BR', { month: 'long' });
    tituloEl.textContent = `Desempenho de ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}`;
    
    if (graficoFinanceiro) graficoFinanceiro.destroy();

    if (!dados || dados.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "16px Arial"; ctx.fillStyle = "#6c757d"; ctx.textAlign = "center";
        ctx.fillText("Sem dados de vendas para este mês.", canvas.width / 2, canvas.height / 2);
        return;
    }

    graficoFinanceiro = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.map(item => new Date(item.dia + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit'})),
            datasets: [{
                label: 'Vendas Diárias (R$)',
                data: dados.map(item => item.totalDiario),
                backgroundColor: 'rgba(255, 160, 64, 0.7)',
                borderColor: 'rgba(255, 111, 0, 1)',
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });
}

function renderizarGraficoABC(info) {
    if (graficoAtualABC) graficoAtualABC.destroy();
    const canvas = document.getElementById("curvaABCChart");
    const ctx = canvas.getContext('2d');
    document.getElementById('titulo-mes-abc').textContent = `Mês: ${dataExibida.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;

    if (!info || !info.labels || info.labels.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "16px Arial"; ctx.fillStyle = "#6c757d"; ctx.textAlign = "center";
        ctx.fillText("Sem dados para a curva ABC.", canvas.width / 2, canvas.height / 2);
        return;
    }
    
    graficoAtualABC = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: info.labels,
            datasets: [{ data: info.dados, backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderizarListaVendidos(lista, tipo) {
    const containerId = tipo === "mais" ? "lista-mais-vendidos" : "lista-menos-vendidos";
    const container = document.getElementById(containerId);
    if (!container) return;
    
    document.getElementById('titulo-mes-mmv').textContent = `Mês: ${dataExibida.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;
    
    container.innerHTML = "";
    if (!lista || lista.length === 0) {
        container.innerHTML = `<li class="list-group-item">Nenhum produto encontrado.</li>`;
        return;
    }

    lista.forEach(item => {
        container.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-start"><div class="ms-2 me-auto"><div class="fw-bold">${item.nome}</div>${item.qtd} unidades</div><span class="badge bg-primary rounded-pill">${parseFloat(item.precoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></li>`;
    });
}

function renderizarProdutosEncalhados(lista) {
    const container = document.getElementById("lista-encalhados");
    if (!container) return;
    
    document.getElementById('titulo-mes-encalhado').textContent = `Mês: ${dataExibida.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;
    container.innerHTML = "";
    
    if (!lista || lista.length === 0) {
        container.innerHTML = `<div class="list-group-item text-muted">🎉 Nenhum produto encalhado encontrado!</div>`;
        return;
    }
    
    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';
    lista.forEach(item => {
        const ultimaVenda = item.ultimaVenda ? new Date(item.ultimaVenda).toLocaleDateString('pt-BR') : 'Nunca';
        listGroup.innerHTML += `<div class="list-group-item list-group-item-action"><div class="d-flex w-100 justify-content-between"><h6 class="mb-1">${item.nome}</h6><small class="text-danger">Validade: ${new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR')}</small></div><p class="mb-1 small">Estoque: ${item.estoque} | Código: ${item.codigo}</p><small class="text-muted">Última venda: ${ultimaVenda}</small></div>`;
    });
    container.appendChild(listGroup);
}