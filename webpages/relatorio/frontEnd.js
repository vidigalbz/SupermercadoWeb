let graficoAtualABC = null;
let graficoFinanceiro = null; // Adicionado para o segundo gráfico
let relatorioData = null; // Guardará os dados da API para serem usados por outras funções

/**
 * Função principal que carrega todos os dados do relatório do backend.
 */
async function carregarDadosDoRelatorio() {
    const params = new URLSearchParams(window.location.search);
    const marketId = params.get('id');

    if (!marketId) {
        alert("Erro: ID do mercado não especificado na URL.");
        return;
    }

    try {
        const response = await fetch('/api/relatorio-data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ marketId: marketId })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Falha ao buscar dados do relatório');
        }

        relatorioData = await response.json();

        // Renderiza todos os componentes da página com os dados recebidos
        renderizarResumoVendas(relatorioData.vendas);
        renderizarGraficoABC(relatorioData.curvaABC);
        renderizarListaVendidos(relatorioData.maisVendidos, "mais");

        // Habilitar funcionalidades extras que agora têm dados
        const menosVendidosTab = document.getElementById('menos-vendidos-tab');
        if (relatorioData.menosVendidos && relatorioData.menosVendidos.length > 0) {
            menosVendidosTab.style.display = 'block';
            menosVendidosTab.onclick = () => renderizarListaVendidos(relatorioData.menosVendidos, "menos");
        } else {
            menosVendidosTab.style.display = 'none'; // Esconde a aba se não houver dados
        }
        document.getElementById('mais-vendidos-tab').onclick = () => renderizarListaVendidos(relatorioData.maisVendidos, "mais");

        // Se a API retornar dados de produtos encalhados, renderize-os
        if(relatorioData.produtosEncalhados) {
            renderizarProdutosEncalhados(relatorioData.produtosEncalhados);
        }


    } catch (error) {
        console.error("Erro ao carregar dados do relatório:", error);
        document.body.innerHTML = `<div class="container mt-5"><div class="alert alert-danger"><strong>Erro ao carregar relatório:</strong> ${error.message}</div></div>`;
    }
}

/**
 * Renderiza os cards de resumo de vendas (Hoje, Semana, Mês).
 */
function renderizarResumoVendas(info) {
    if (!info) return;

    const valorHoje = parseFloat(info.hoje[0]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("qnt-hoje").textContent = valorHoje;
    document.getElementById("prcn-hoje").textContent = `${info.hoje[1]}% em relação ao dia anterior`;

    const valorSemana = parseFloat(info.semana[0]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("qnt-semana").textContent = valorSemana;
    document.getElementById("prcn-semana").textContent = `${info.semana[1]}% em relação à semana anterior`;

    const valorMes = parseFloat(info.mes[0]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("qnt-mes").textContent = valorMes;
    document.getElementById("prcn-mes").textContent = `${info.mes[1]}% em relação ao mês anterior`;
}

/**
 * Renderiza o gráfico de pizza da Curva ABC.
 */
function renderizarGraficoABC(info) {
    if (graficoAtualABC) graficoAtualABC.destroy();
    if (!info || !info.labels || !info.dados) return;

    const ctx = document.getElementById("curvaABCChart").getContext('2d');
    graficoAtualABC = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: info.labels,
            datasets: [{
                data: info.dados,
                backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Isso agora funciona por causa do CSS
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

/**
 * Renderiza a lista de produtos (mais ou menos vendidos, encalhados).
 */
function renderizarListaVendidos(lista, tipo) {
    const container = document.getElementById(tipo === "mais" ? "lista-mais-vendidos" : "lista-menos-vendidos");
    if (!container) return;
    
    container.innerHTML = "";
    if (!lista || lista.length === 0) {
        container.innerHTML = `<li class="list-group-item">Nenhum produto encontrado.</li>`;
        return;
    }

    lista.forEach(item => {
        const precoFormatado = parseFloat(item.precoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        container.innerHTML +=
            `<li class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${item.nome}</div>
                    ${item.qtd} unidades
                </div>
                <span class="badge bg-primary rounded-pill">${precoFormatado}</span>
            </li>`;
    });
}

function renderizarProdutosEncalhados(lista) {
    const container = document.getElementById("lista-encalhados");
    if (!container) return;

    container.innerHTML = ""; // Limpa o conteúdo de exemplo
    if (!lista || lista.length === 0) {
        container.innerHTML = `<div class="list-group-item">Nenhum produto encalhado encontrado.</div>`;
        return;
    }
    
    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';
    
    lista.forEach(item => {
        listGroup.innerHTML +=
            `<div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${item.nome}</h6>
                    <small class="text-danger">Validade: ${new Date(item.validade).toLocaleDateString()}</small>
                </div>
                <p class="mb-1 small">Estoque: ${item.estoque} unidades | Código: ${item.codigo}</p>
                <small class="text-muted">Última venda: ${item.ultimaVenda ? new Date(item.ultimaVenda).toLocaleDateString() : 'Nunca'}</small>
            </div>`;
    });
    container.appendChild(listGroup);
}


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', carregarDadosDoRelatorio);