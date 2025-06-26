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

// Função para formatar valores em moeda brasileira
function formatCurrency(value) {
    return parseFloat(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Função auxiliar para converter canvas em imagem
function getCanvasImage(canvas, scale = 1) {
    return new Promise((resolve) => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;

        tempCtx.fillStyle = "#FFFFFF";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        tempCtx.scale(scale, scale);
        tempCtx.drawImage(canvas, 0, 0);

        tempCanvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => resolve(img);
            };
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.9);
    });
}


// Função para exportar para PDF
async function exportarPDF() {
    if (!relatorioData) {
        alert("Por favor, gere os relatórios primeiro!");
        return;
    }

    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();
    document.getElementById('spinnerSection').classList.remove('d-none');
    document.getElementById('okSection').classList.add('d-none');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPos = 20;
        const lineHeight = 7;

        // Cabeçalho
        doc.setFontSize(18).setTextColor(40, 40, 40);
        doc.text("Relatório de Vendas - Mercado Didático", pageWidth / 2, yPos, { align: "center" });

        yPos += 10;
        doc.setFontSize(12).setTextColor(100, 100, 100);
        const dataRelatorio = dataExibida.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        doc.text(`Período: ${dataRelatorio.charAt(0).toUpperCase() + dataRelatorio.slice(1)}`, pageWidth / 2, yPos, { align: "center" });

        yPos += 10;
        doc.setDrawColor(200, 200, 200).line(margin, yPos, pageWidth - margin, yPos);

        // Resumo de Vendas
        yPos += 15;
        doc.setFontSize(14).setTextColor(40, 40, 40).text("Resumo de Vendas", margin, yPos);
        yPos += 10;

        const resumoData = [
            ["Vendas Hoje", relatorioData.vendas.hoje[0], `${relatorioData.vendas.hoje[1]}%`],
            ["Vendas 7 Dias", relatorioData.vendas.semana[0], `${relatorioData.vendas.semana[1]}%`],
            ["Vendas 30 Dias", relatorioData.vendas.mes[0], "Total do Mês"]
        ];

        doc.setFontSize(10).setTextColor(80, 80, 80).setFillColor(240, 240, 240);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.text("Período", margin + 5, yPos + 5);
        doc.text("Valor", margin + 70, yPos + 5);
        doc.text("Variação", margin + 120, yPos + 5);
        yPos += 8;

        resumoData.forEach(row => {
            if (yPos > 250) { doc.addPage(); yPos = 20; }
            doc.text(row[0], margin + 5, yPos + 5);
            doc.text(formatCurrency(row[1]), margin + 70, yPos + 5);
            doc.text(row[2], margin + 120, yPos + 5);
            doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);
            yPos += 8;
        });

        // Gráfico Financeiro
        yPos += 15;
        if (yPos > 220) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14).text("Desempenho Financeiro", margin, yPos);
        yPos += 10;

        const canvasFinanceiro = document.getElementById('graficoFinanceiro');
        if (canvasFinanceiro) {
            const canvasImg = await getCanvasImage(canvasFinanceiro, 1);
            if (canvasImg) {
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;
                if (yPos + imgHeight > 270) { doc.addPage(); yPos = 20; }
                doc.addImage(canvasImg, 'JPEG', margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10;
            }
        }

        // Gráfico Curva ABC
        if (yPos > 220) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14).text("Curva ABC de Produtos", margin, yPos);
        yPos += 10;

        const canvasABC = document.getElementById('curvaABCChart');
        if (canvasABC) {
            const canvasImg = await getCanvasImage(canvasABC, 0.8);
            const imgWidth = (pageWidth - 2 * margin) * 0.8;
            const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;
            const imgX = margin + ((pageWidth - 2 * margin - imgWidth) / 2);
            if (yPos + imgHeight > 270) { doc.addPage(); yPos = 20; }
            doc.addImage(canvasImg, 'JPEG', imgX, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
        }

        // Produtos Mais Vendidos
        yPos += 15;
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14).text("Produtos Mais Vendidos", margin, yPos);
        yPos += 10;
        doc.setFontSize(10).setFillColor(240, 240, 240);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.text("Posição", margin + 5, yPos + 5);
        doc.text("Produto", margin + 25, yPos + 5);
        doc.text("Quantidade", margin + 100, yPos + 5);
        doc.text("Valor Total", margin + 140, yPos + 5);
        yPos += 8;

        relatorioData.maisVendidos.forEach((produto, index) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                doc.text("Posição", margin + 5, yPos + 5);
                doc.text("Produto", margin + 25, yPos + 5);
                doc.text("Quantidade", margin + 100, yPos + 5);
                doc.text("Valor Total", margin + 140, yPos + 5);
                yPos += 8;
            }

            doc.text((index + 1).toString(), margin + 5, yPos + 5);
            const productLines = doc.splitTextToSize(produto.nome, 60);
            doc.text(productLines, margin + 25, yPos + 5);
            doc.text(produto.qtd.toString(), margin + 100, yPos + 5);
            doc.text(formatCurrency(produto.precoTotal), margin + 140, yPos + 5);
            doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);
            yPos += Math.max(8, productLines.length * lineHeight);
        });

        // Produtos Encalhados
        yPos += 15;
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14).text("Produtos Encalhados", margin, yPos);
        yPos += 15;
        doc.setFontSize(10).setFillColor(240, 240, 240);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.text("Produto", margin + 5, yPos + 5);
        doc.text("Estoque", margin + 70, yPos + 5);
        doc.text("Validade", margin + 100, yPos + 5);
        doc.text("Última Venda", margin + 140, yPos + 5);
        yPos += 8;

        relatorioData.produtosEncalhados.forEach(produto => {
            if (yPos > 250) {
                doc.addPage(); yPos = 20;
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                doc.text("Produto", margin + 5, yPos + 5);
                doc.text("Estoque", margin + 70, yPos + 5);
                doc.text("Validade", margin + 100, yPos + 5);
                doc.text("Última Venda", margin + 140, yPos + 5);
                yPos += 8;
            }

            const productLines = doc.splitTextToSize(produto.nome, 60);
            doc.text(productLines, margin + 5, yPos + 5);
            doc.text(produto.estoque.toString(), margin + 70, yPos + 5);
            doc.text(new Date(produto.validade + 'T00:00:00').toLocaleDateString('pt-BR'), margin + 100, yPos + 5);
            doc.text(produto.ultimaVenda ? new Date(produto.ultimaVenda).toLocaleDateString('pt-BR') : 'Nunca', margin + 140, yPos + 5);
            doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);
            yPos += Math.max(8, productLines.length * lineHeight);
        });

        // Rodapé com numeração de páginas
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8).setTextColor(150, 150, 150);
            doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, 290, { align: "right" });
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, 290);
        }

        doc.save(`Relatorio_MercadoDidatico_${dataExibida.getMonth() + 1}_${dataExibida.getFullYear()}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar PDF.");
    } finally {
        document.getElementById('spinnerSection').classList.add('d-none');
        document.getElementById('okSection').classList.remove('d-none');
    }
}

// Exportar para CSV
function exportarCSV() {
    if (!relatorioData) {
        alert("Por favor, gere os relatórios primeiro!");
        return;
    }

    const csvData = [];
    const dataRelatorio = dataExibida.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Cabeçalho
    csvData.push(`"Relatório de Vendas - Mercado Didático"`);
    csvData.push(`"Período: ${dataRelatorio}"`);
    csvData.push("");

    // Resumo de Vendas
    csvData.push('"Resumo de Vendas"');
    csvData.push('"Período","Valor","Variação"');
    csvData.push(`"Vendas Hoje","${formatCurrency(relatorioData.vendas.hoje[0])}","${relatorioData.vendas.hoje[1]}%"`);
    csvData.push(`"Vendas 7 Dias","${formatCurrency(relatorioData.vendas.semana[0])}","${relatorioData.vendas.semana[1]}%"`);
    csvData.push(`"Vendas 30 Dias","${formatCurrency(relatorioData.vendas.mes[0])}","Total do Mês"`);
    csvData.push("");

    // Produtos Mais Vendidos
    csvData.push('"Produtos Mais Vendidos"');
    csvData.push('"Posição","Produto","Quantidade","Valor Total"');
    relatorioData.maisVendidos.forEach((produto, index) => {
        csvData.push(`"${index + 1}","${produto.nome}","${produto.qtd}","${formatCurrency(produto.precoTotal)}"`);
    });
    csvData.push("");

    // Produtos Encalhados
    csvData.push('"Produtos Encalhados"');
    csvData.push('"Produto","Estoque","Validade","Última Venda"');
    relatorioData.produtosEncalhados.forEach(produto => {
        const validade = new Date(produto.validade + 'T00:00:00').toLocaleDateString('pt-BR');
        const ultimaVenda = produto.ultimaVenda ? new Date(produto.ultimaVenda).toLocaleDateString('pt-BR') : 'Nunca';
        csvData.push(`"${produto.nome}","${produto.estoque}","${validade}","${ultimaVenda}"`);
    });

    // Junta tudo e adiciona BOM UTF-8
    const csvContent = csvData.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `Relatorio_MercadoDidatico_${dataExibida.getMonth() + 1}_${dataExibida.getFullYear()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Imprimir Relatório
function imprimirRelatorio() {
    if (!relatorioData) {
        alert("Por favor, gere os relatórios primeiro!");
        return;
    }

    const printWindow = window.open('', '_blank');
    const dataRelatorio = dataExibida.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Vendas - Mercado Didático</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; margin-bottom: 5px; }
                .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #f2f2f2; padding: 8px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                .summary-card { display: inline-block; width: 30%; margin: 0 1.5%; text-align: center; }
                .summary-value { font-size: 20px; font-weight: bold; }
                .summary-label { font-size: 14px; color: #555; }
            </style>
        </head>
        <body>
            <h1>Relatório de Vendas</h1>
            <div class="subtitle">Mercado Didático - ${dataRelatorio}</div>

            <div class="summary-section">
                <div class="summary-card">
                    <div class="summary-label">Vendas Hoje</div>
                    <div class="summary-value">${formatCurrency(relatorioData.vendas.hoje[0])}</div>
                    <div class="summary-label">${relatorioData.vendas.hoje[1]}%</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Vendas 7 Dias</div>
                    <div class="summary-value">${formatCurrency(relatorioData.vendas.semana[0])}</div>
                    <div class="summary-label">${relatorioData.vendas.semana[1]}%</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Vendas 30 Dias</div>
                    <div class="summary-value">${formatCurrency(relatorioData.vendas.mes[0])}</div>
                    <div class="summary-label">Total do Mês</div>
                </div>
            </div>

            <h2>Produtos Mais Vendidos</h2>
            <table>
                <thead><tr><th>Posição</th><th>Produto</th><th>Quantidade</th><th>Valor Total</th></tr></thead>
                <tbody>
                    ${relatorioData.maisVendidos.map((p, i) => `
                        <tr><td>${i + 1}</td><td>${p.nome}</td><td>${p.qtd}</td><td>${formatCurrency(p.precoTotal)}</td></tr>
                    `).join('')}
                </tbody>
            </table>

            <h2>Produtos Encalhados</h2>
            <table>
                <thead><tr><th>Produto</th><th>Estoque</th><th>Validade</th><th>Última Venda</th></tr></thead>
                <tbody>
                    ${relatorioData.produtosEncalhados.map(p => `
                        <tr><td>${p.nome}</td><td>${p.estoque}</td><td>${new Date(p.validade + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td>${p.ultimaVenda ? new Date(p.ultimaVenda).toLocaleDateString('pt-BR') : 'Nunca'}</td></tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}