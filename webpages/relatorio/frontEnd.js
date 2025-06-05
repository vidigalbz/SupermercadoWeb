let graficoAtualFinanceiro = null;
let graficoAtualABC = null;

let mesAtualIndex = dadosFinanceirosPorMes.length - 2;

function renderizarResumoVendas(Info) {
    if (!Info.hoje) {
        console.error("Dados de vendas do dia não disponíveis.");
        return
    } else if (Info.hoje.length < 2) {
        console.error("Dados insuficientes para renderizar resumo de vendas.");
        return
    } else if (Info.hoje[0] === "0,00") {
        document.getElementById("qnt-hoje").textContent = "R$0,00";
        document.getElementById("prcn-hoje").textContent = "Sem vendas hoje";
    } else {
        document.getElementById("qnt-hoje").textContent = "R$" + Info.hoje[0];
        document.getElementById("prcn-hoje").textContent = Info.hoje[1] + "%" + " em relação ao dia anterior";
    }

    if (!Info.semana) {
        console.error("Dados de vendas da semana não disponíveis.");
        return
    } else if (Info.semana.length < 2) {
        console.error("Dados insuficientes para renderizar resumo de vendas.");
        return
    } else if (Info.semana[0] === "0,00") {
        document.getElementById("qnt-semana").textContent = "R$0,00";
        document.getElementById("prcn-semana").textContent = "Sem vendas semana";
    } else {
        document.getElementById("qnt-semana").textContent = "R$" + Info.semana[0];
        document.getElementById("prcn-semana").textContent = Info.semana[1] + "%" + " em relação ao semana anterior";
    }

    if (!Info.mes) {
        console.error("Dados de vendas do mês não disponíveis.");
        return
    } else if (Info.mes.length < 2) {
        console.error("Dados insuficientes para renderizar resumo de vendas.");
        return
    } else if (Info.hoje[0] === "0,00") {
        document.getElementById("qnt-mes").textContent = "R$0,00";
        document.getElementById("prcn-mes").textContent = "Sem vendas mes";
    } else {
        document.getElementById("qnt-mes").textContent = "R$" + Info.mes[0];
        document.getElementById("prcn-mes").textContent = Info.mes[1] + "%" + " em relação ao mes anterior";
    }
}

function renderizarGraficoABC(Info) {
    if (graficoAtualABC) {
        graficoAtualABC.destroy();
    }

    const ctx = document.getElementById("curvaABCChart").getContext('2d');
    const labels = Info.labels;
    const dados = Info.dados;
    const cores = Info.cores;

    graficoAtualABC = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                backgroundColor: cores,
                borderColor: cores,
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderizarListaVendidos(lista, tipo) {
    let ul;
    if (tipo === "mais") {
        ul = document.getElementById("lista-mais-vendidos");
    } else if (tipo === "menos") {
        ul = document.getElementById('lista-menos-vendidos');
    } else {
        console.error("Tipo inválido para renderizar lista de vendidos.");
        return
    }

    ul.innerHTML = "";

    lista.forEach(item => {
        ul.innerHTML +=
            `<li class="list-group-item d-flex justify-content-between align-items-start">
            <div class="ms-2 me-auto">
                <div class="fw-bold">${item.nome}</div>
                ${item.qtd} unidades
            </div>
            <span class="badge bg-primary rounded-pill">R$ ${item.precoTotal}</span>
        </li>`;

    });
}

// função dos botões de mais e menos vendidos
document.getElementById('mais-vendidos-tab').onclick = () => renderizarListaVendidos(vendasPorMes[mesAtualIndex].maisVendidos, "mais");
document.getElementById('menos-vendidos-tab').onclick = () => renderizarListaVendidos(vendasPorMes[mesAtualIndex].menosVendidos, "menos");

// função do botao de ver o mes anterior
document.getElementById('btn-mes-anterior').onclick = () => {
    if (mesAtualIndex > 0) {
        mesAtualIndex--;
        renderizarGraficoFinanceiro([dadosFinanceirosPorMes[mesAtualIndex]]);
        renderizarGraficoABC(vendasPorClasse[mesAtualIndex]);
        renderizarListaVendidos(vendasPorMes[mesAtualIndex].maisVendidos, "mais");
        renderizarListaVendidos(vendasPorMes[mesAtualIndex].menosVendidos, "menos");
        renderizarProdutosEncalhados(produtosEncalhados[mesAtualIndex].produtos);
        atualizarLabelMes();
    }
};

// função do botao de ver o proximo mes
document.getElementById('btn-proximo-mes').onclick = () => {
    if (mesAtualIndex < dadosFinanceirosPorMes.length - 1) {
        mesAtualIndex++;
        renderizarGraficoFinanceiro([dadosFinanceirosPorMes[mesAtualIndex]]);
        renderizarGraficoABC(vendasPorClasse[mesAtualIndex]);
        renderizarListaVendidos(vendasPorMes[mesAtualIndex].maisVendidos, "mais");
        renderizarListaVendidos(vendasPorMes[mesAtualIndex].menosVendidos, "menos");
        renderizarProdutosEncalhados(produtosEncalhados[mesAtualIndex].produtos);
        atualizarLabelMes();
    }
};

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const mes = dadosFinanceirosPorMes[mesAtualIndex];
    doc.text(`Relatório Financeiro - ${mes.mes}`, 10, 10);
    doc.text(`Receita: R$ ${mes.receita}`, 10, 20);
    doc.text(`Despesa: R$ ${mes.despesa}`, 10, 30);
    doc.text(`Lucro: R$ ${mes.lucro}`, 10, 40);
    doc.save(`relatorio-financeiro-${mes.mes}.pdf`);
}

function exportarCSV() {
    const mes = dadosFinanceirosPorMes[mesAtualIndex];
    const csv = Papa.unparse([
        ["Mês", "Receita", "Despesa", "Lucro"],
        [mes.mes, mes.receita, mes.despesa, mes.lucro]
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorio-financeiro-${mes.mes}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderizarGraficoFinanceiro(dados) {
    if (graficoAtualFinanceiro) {
        graficoAtualFinanceiro.destroy();
    }

    const titulo = document.getElementById("titulo-financeiro");
    titulo.textContent = `Relatório Financeiro - ${dados[0].mes}`;

    const ctx = document.getElementById("graficoFinanceiro").getContext('2d');

    const labels = dados.map(item => item.mes);
    const receita = dados.map(item => item.receita);
    const despesa = dados.map(item => item.despesa);
    const lucro = dados.map(item => item.lucro);

    graficoAtualFinanceiro = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receita Bruta (R$)',
                    data: receita,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Despesa (R$)',
                    data: despesa,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Lucro Líquido (R$)',
                    data: lucro,
                    backgroundColor: 'rgba(255, 193, 7, 0.7)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function atualizarLabelMes() {
    let mes = `Mês: ${dadosFinanceirosPorMes[mesAtualIndex].mes}`;
    document.getElementById("titulo-mes-atual").textContent = mes;
    document.getElementById("titulo-mes-abc").textContent = mes;
    document.getElementById("titulo-mes-encalhado").textContent = mes;
    document.getElementById("titulo-mes-mmv").textContent = mes;
}

function renderizarProdutosEncalhados(produtos) {
    const ul = document.getElementById("lista-encalhados");
    ul.innerHTML = ""; // Limpa a lista antes de renderizar
    produtos.forEach(item => {
        ul.innerHTML +=
            `<div class="list-group">
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${item.nome}</h6>
                    <small class="text-danger">${item.validade}</small>
                </div>
                <p class="mb-1 small">Estoque: ${item.estoque} unidades</p>
                <p class="mb-1 small">Codigo: ${item.codigo} | Lote: ${item.lote}</p>
                <small class="text-muted">Última venda: ${item.ultimaVenda}</small>
            </div>
        </div>`
    });
}

function gerarRelatorios() {
    //fazer calculos e gerar os dados necessários para os relatórios
}