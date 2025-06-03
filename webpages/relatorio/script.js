const dadosFinanceirosPorMes = [
    { mes: 'Jan', receita: 30000, despesa: 10000, lucro: 20000 },
    { mes: 'Fev', receita: 20000, despesa: 15000, lucro: 5000 },
    { mes: 'Mar', receita: 38000, despesa: 16000, lucro: 22000 },
    { mes: 'Abr', receita: 50000, despesa: 32000, lucro: 18000 },
    { mes: 'Mai', receita: 52000, despesa: 33000, lucro: 19000 },
    { mes: 'Jun', receita: 50000, despesa: 33000, lucro: 17000 },
    { mes: 'Jul', receita: 50000, despesa: 32000, lucro: 18000 },
    { mes: 'Ago', receita: 40000, despesa: 12000, lucro: 28000 },
    { mes: 'Set', receita: 35000, despesa: 40000, lucro: 1000 },
    { mes: 'Out', receita: 32000, despesa: 45000, lucro: 1000 },
    { mes: 'Nov', receita: 25000, despesa: 10000, lucro: 15000 },
    { mes: 'Dez', receita: 46000, despesa: 40000, lucro: 6000 }
];

let mesAtualIndex = dadosFinanceirosPorMes.length - 2;

const ctx = document.getElementById('curvaABCChart').getContext('2d');
new Chart(ctx, {
    type: 'pie',
    data: {
        //informações que fica abaixo do gráfico
        labels: ['Classe A (50%)', 'Classe B (25%)', 'Classe C (25%)'],
        datasets: [{
            //data atualiza no grafico
            data: [50, 25, 25],
            backgroundColor: ['#198754', '#ffc107', '#dc3545'],
            borderColor: '#fff',
            borderWidth: 1
        }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
});

const maisVendidos = [
    { nome: "Arroz", qtd: 320 },
    { nome: "Feijão", qtd: 280 },
    { nome: "Macarrão", qtd: 200 },
    { nome: "Sabão", qtd: 180 },
    { nome: "Óleo", qtd: 170 }
];
const menosVendidos = [
    { nome: "Molho Inglês", qtd: 5 },
    { nome: "Curry", qtd: 7 },
    { nome: "Açafrão", qtd: 10 },
    { nome: "Picles", qtd: 12 },
    { nome: "Alcaparra", qtd: 15 }
];

function renderizarListaVendidos(lista) {
    const ul = document.getElementById('lista-vendidos');
    ul.innerHTML = '';
    lista.forEach(item => {
        ul.innerHTML += `<li class="list-group-item d-flex justify-content-between">${item.nome} <span>${item.qtd}</span></li>`;
    });
}

renderizarListaVendidos(maisVendidos);

document.getElementById('btn-mais-vendidos').onclick = () => renderizarListaVendidos(maisVendidos);
document.getElementById('btn-menos-vendidos').onclick = () => renderizarListaVendidos(menosVendidos);

function atualizarGraficoFinanceiro() {
    const ctx = document.getElementById('graficoFinanceiro').getContext('2d');
    const mes = dadosFinanceirosPorMes[mesAtualIndex];
    if (window.financeiroChart) window.financeiroChart.destroy();
    window.financeiroChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [mes.mes],
            datasets: [
                { label: 'Receita', data: [mes.receita], backgroundColor: '#198754' },
                { label: 'Despesa', data: [mes.despesa], backgroundColor: '#dc3545' },
                { label: 'Lucro', data: [mes.lucro], backgroundColor: '#0d6efd' }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

document.getElementById('btn-mes-anterior').onclick = () => {
    if (mesAtualIndex > 0) {
        mesAtualIndex--;
        atualizarGraficoFinanceiro();
    }
};

document.getElementById('btn-proximo-mes').onclick = () => {
    if (mesAtualIndex < dadosFinanceirosPorMes.length - 1) {
        mesAtualIndex++;
        atualizarGraficoFinanceiro();
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

atualizarGraficoFinanceiro();