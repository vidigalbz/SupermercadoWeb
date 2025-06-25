let debounceTimer;
function debounce(func, delay) {
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Você precisa estar logado para acessar o histórico.");
    window.location.href = "/login";
    return;
  }
  carregarSupermercados();
});

async function carregarSupermercados() {
  const selectEl = document.getElementById("select-market");
  const userId = localStorage.getItem("userId");

  if (!userId) {
    console.error("HISTORICO: Usuário não logado. userId não encontrado no localStorage.");
    if (selectEl) selectEl.innerHTML = `<option value="">Usuário não identificado</option>`;

    clearAllHistoryAccordions("Faça login para ver o histórico ou selecionar um supermercado.");
    return;
  }

  if (selectEl) selectEl.innerHTML = `<option value="">Carregando supermercados...</option>`;

  try {
    const response = await fetch("/api/historico/listarSupermercados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId })
    });

    const responseBodyText = await response.text();

    if (!response.ok) {
      let errorMsg = `Erro ${response.status} ao buscar supermercados.`;
      try {
        const errorJson = JSON.parse(responseBodyText);
        errorMsg += ` Detalhe: ${errorJson.error || errorJson.message || responseBodyText}`;
      } catch (e) {
        errorMsg += ` Resposta do servidor: ${responseBodyText.substring(0, 200)}`;
      }
      throw new Error(errorMsg);
    }

    const result = JSON.parse(responseBodyText);
    if (!result.success) {
      throw new Error(result.error || "Falha ao listar supermercados (backend retornou success: false).");
    }

    if (!result.data || result.data.length === 0) {
      if (selectEl) selectEl.innerHTML = `<option value="">Nenhum supermercado encontrado</option>`;
      localStorage.removeItem("marketId");
      clearAllHistoryAccordions("Nenhum supermercado encontrado para este usuário.");
      if (typeof carregarHistorico === 'function') carregarHistorico();
      return;
    }

    if (selectEl) {
      selectEl.innerHTML = result.data.map(m =>
          `<option value="${m.marketId}" ${m.marketId === localStorage.getItem("marketId") ? "selected" : ""}>
              ${m.name} (${m.marketId})
          </option>`
      ).join("");

      let currentMarketIdInStorage = localStorage.getItem("marketId");
      const isValidMarketIdStored = result.data.some(m => m.marketId === currentMarketIdInStorage);

      if ((!currentMarketIdInStorage || !isValidMarketIdStored) && result.data.length > 0) {
          currentMarketIdInStorage = result.data[0].marketId;
          localStorage.setItem("marketId", currentMarketIdInStorage);
      }
      
      if (localStorage.getItem("marketId")) {
          selectEl.value = localStorage.getItem("marketId");
      } else if (result.data.length > 0) {
           selectEl.value = result.data[0].marketId;
      }

    }
    
    if (typeof carregarHistorico === 'function') {
      carregarHistorico();
    }

  } catch (err) {
    console.error("HISTORICO: Erro detalhado em carregarSupermercados:", err.message);
    if (selectEl) selectEl.innerHTML = `<option value="">Erro ao carregar</option>`;
    
    if (typeof mostrarNotificacaoGlobal === 'function') {
        mostrarNotificacaoGlobal('Erro', `Falha ao carregar lista de supermercados: ${err.message}.`, 'error');
    } else {
        console.warn("Função mostrarNotificacaoGlobal não definida na página de histórico.");
    }
    clearAllHistoryAccordions(`Falha ao carregar supermercados: ${err.message}`);
  }
}
  
function clearAllHistoryAccordions(message = "Nenhum dado para exibir.") {
    const accordions = ['entradasAccordion', 'saidasAccordion', 'alteracoesAccordion', 'remocoesAccordion'];
    const emptyMsgHTML = `<div class="alert alert-info mt-3"><i class="bi bi-info-circle"></i> ${message}</div>`;
    accordions.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = emptyMsgHTML;
    });
}


async function carregarHistorico() {
  const marketId = localStorage.getItem("marketId");
  const userId = localStorage.getItem("userId");
  const busca = document.getElementById("pesquisa")?.value || "";

  const accordions = {
      entradas: document.getElementById("entradasAccordion"),
      saidas: document.getElementById("saidasAccordion"),
      alteracoes: document.getElementById("alteracoesAccordion"),
      remocoes: document.getElementById("remocoesAccordion")
  };

  const loadingHTML = `
      <div class="text-center my-4">
          <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div>
          <p class="text-muted mt-2">Carregando histórico...</p>
      </div>`;
  Object.values(accordions).forEach(el => { if (el) el.innerHTML = loadingHTML; });

  if (!userId || !marketId) {
      const errorMsg = !userId ? "Usuário não autenticado." : "Nenhum supermercado selecionado.";
      Object.values(accordions).forEach(el => {
          if (el) el.innerHTML = `<div class="alert alert-warning mt-3">${errorMsg}</div>`;
      });
      return;
  }

  try {
      const response = await fetch("/api/historico/historicoData", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              marketId, 
              userId: parseInt(userId),
              busca: busca.trim()
              // O parâmetro 'categoria' foi removido do corpo da requisição
          })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erro de rede ou resposta não JSON" }));
          throw new Error(errorData.error || `Erro ${response.status} ao carregar histórico.`);
      }
      const result = await response.json();

      if (!result.success || !result.data) {
          throw new Error(result.error || "Resposta inválida do servidor ao carregar histórico.");
      }
      
      Object.values(accordions).forEach(el => { if (el) el.innerHTML = ''; });

      if (result.data.length === 0) {
          const emptyMsg = `<div class="alert alert-info mt-3"><i class="bi bi-info-circle"></i> Nenhum registro encontrado com os filtros atuais.</div>`;
          Object.values(accordions).forEach(el => { if (el) el.innerHTML = emptyMsg; });
          return;
      }

      const grouped = { entrada: [], saida: [], edicao: [], remocao: [] };
      result.data.forEach(item => {
          if (item.type === 'entrada') grouped.entrada.push(item);
          else if (item.type === 'saida') grouped.saida.push(item);
          else if (item.type === 'edicao') grouped.edicao.push(item);
          else if (item.type === 'remocao') grouped.remocao.push(item);
      });

      renderHistoricoItems(grouped.entrada, accordions.entradas, 'entrada');
      renderHistoricoItems(grouped.saida, accordions.saidas, 'saida');
      renderHistoricoItems(grouped.edicao, accordions.alteracoes, 'edicao');
      renderHistoricoItems(grouped.remocao, accordions.remocoes, 'remocao');

  } catch (err) {
      console.error("Erro detalhado ao carregar histórico:", err);
      const errorHTML = `<div class="alert alert-danger mt-3"><i class="bi bi-exclamation-triangle"></i> <strong>Erro:</strong> ${err.message}</div>`;
      Object.values(accordions).forEach(el => { if (el) el.innerHTML = errorHTML; });
  }
}

function renderHistoricoItems(items, container, typeKey) {
  if (!container) return;
  container.innerHTML = '';

  if (!items || items.length === 0) {
      container.innerHTML = `<p class="text-muted py-3"><i class="bi bi-database-exclamation"></i> Nenhum registro de ${getTypeNameDisplay(typeKey)} encontrado.</p>`;
      return;
  }

  items.forEach((item, index) => {
      const before = item.beforeData || {};
      const after = item.afterData || {};
      const dataFormatada = item.date ? formatDate(item.date) : 'Data desconhecida';
      const productName = item.name || (typeKey === 'remocao' && before.name) || (typeKey === 'entrada' && after.name) || `Produto ID: ${item.productId || 'N/A'}`;
      const itemHTML = `
          <div class="accordion-item">
              <h2 class="accordion-header" id="heading-${typeKey}-${index}">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                          data-bs-target="#collapse-${typeKey}-${index}" aria-expanded="false" aria-controls="collapse-${typeKey}-${index}">
                      <i class="bi ${getTypeIcon(typeKey)} me-2 text-${getTypeColor(typeKey)}"></i>
                      ${productName}
                      <span class="badge bg-${getTypeColor(typeKey)} ms-auto">${dataFormatada}</span>
                  </button>
              </h2>
              <div id="collapse-${typeKey}-${index}" class="accordion-collapse collapse" aria-labelledby="heading-${typeKey}-${index}">
                  <div class="accordion-body">
                      <div class="linha"><strong>ID do Produto:</strong> ${item.productId || 'N/A'}</div>
                      ${item.barcode ? `<div class="linha"><strong>Cód. Barras:</strong> ${item.barcode}</div>` : ''}
                      ${getTypeDetails(typeKey, before, after)}
                  </div>
              </div>
          </div>`;
      container.insertAdjacentHTML('beforeend', itemHTML);
  });
}

function getTypeNameDisplay(typeKey) {
  return { entrada: 'entrada', saida: 'saída', edicao: 'alteração', remocao: 'remoção' }[typeKey] || typeKey;
}
function getTypeIcon(typeKey) {
  return { entrada: 'bi-box-arrow-in-down', saida: 'bi-box-arrow-right', edicao: 'bi-pencil-square', remocao: 'bi-trash3' }[typeKey] || 'bi-question-circle';
}
function getTypeColor(typeKey) {
  return { entrada: 'success', saida: 'danger', edicao: 'primary', remocao: 'warning' }[typeKey] || 'secondary';
}
function formatDate(dateString) {
  if (!dateString) return 'Data inválida';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatValue(value, prefix = '') {
  if (value === null || typeof value === 'undefined' || String(value).trim() === '') return '-';
  if (typeof value === 'number' && prefix === 'R$ ') return `${prefix}${value.toFixed(2)}`;
  return `${prefix}${value}`;
}

function getTypeDetails(typeKey, before, after) {
  let details = '';
  if (typeKey === 'entrada') {
    details += `<div class="linha"><strong>Nome:</strong> ${formatValue(after.name)}</div>`;
    details += `<div class="linha"><strong>Quantidade Adicionada:</strong> ${formatValue(after.stock)}</div>`;
    details += `<div class="linha"><strong>Preço de Entrada:</strong> ${formatValue(after.price, 'R$ ')}</div>`;
  } else if (typeKey === 'saida') {
    details += `<div class="linha"><strong>Nome:</strong> ${formatValue(before.name || after.name)}</div>`;
    details += `<div class="linha"><strong>Estoque Anterior:</strong> ${formatValue(before.stock)}</div>`;
    details += `<div class="linha"><strong>Estoque Atual:</strong> ${formatValue(after.stock)}</div>`;
    details += `<div class="linha"><strong>Quantidade Retirada:</strong> ${formatValue(before.stock - after.stock)}</div>`;
  } else if (typeKey === 'remocao') {
    details += `<div class="linha"><strong>Produto Removido:</strong> ${formatValue(before.name)}</div>`;
    details += `<div class="linha"><strong>Estoque no momento da remoção:</strong> ${formatValue(before.stock)}</div>`;
    details += `<div class="linha"><strong>Preço no momento da remoção:</strong> ${formatValue(before.price, 'R$ ')}</div>`;

  } else if (typeKey === 'edicao') {
    details += `
      <div class="alteracao-comparacao mt-2">
        <div class="antes p-2 rounded" style="background-color: #ffeeba; border: 1px solid #ffdf7e; flex-basis: 48%;">
          <h6><strong><i class="bi bi-arrow-left-circle"></i> Antes:</strong></h6>
          ${Object.keys(before).map(key => {
            if (key === 'image' || key === 'marketId' || key === 'productId' || before[key] === (after[key] || '')) return '';
            if(JSON.stringify(before[key]) === JSON.stringify(after[key])) return '';
            return `<div class="linha"><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${formatValue(before[key], key === 'price' ? 'R$ ' : '')}</div>`;
          }).join('')}
        </div>
        <div class="depois p-2 rounded" style="background-color: #cce5ff; border: 1px solid #b8daff; flex-basis: 48%;">
          <h6><strong><i class="bi bi-arrow-right-circle"></i> Depois:</strong></h6>
          ${Object.keys(after).map(key => {
             if (key === 'image' || key === 'marketId' || key === 'productId' || after[key] === (before[key] || '')) return '';
             if(JSON.stringify(after[key]) === JSON.stringify(before[key])) return '';
             return `<div class="linha"><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${formatValue(after[key], key === 'price' ? 'R$ ' : '')}</div>`;
          }).join('')}
        </div>
      </div>`;

    if (!details.includes('<div class="linha">')) {
      details = '<div class="alert alert-light mt-2">Nenhuma alteração significativa nos campos principais foi registrada (ou os valores permaneceram os mesmos).</div>';
    }
  }
  return details;
}

function trocarSupermercado() {
  const novoMarketId = document.getElementById("select-market").value;
  if (novoMarketId) {
    localStorage.setItem("marketId", novoMarketId);
    carregarHistorico();
  } else {
    localStorage.removeItem("marketId");
    clearAllHistoryAccordions("Nenhum supermercado selecionado.");
  }
}