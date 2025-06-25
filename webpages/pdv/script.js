// webpages/pdv/script.js

// Global variables
let productsOnScreen = {};
let totalPrice = 0;
let totalQuantity = 0;
let currentInvoice = null;
let modalInstance = null; // Para o globalAlertModal
const codigoInput = document.getElementById("codigoProdutoInput");
let currentMarketId; // Será definido no DOMContentLoaded a partir da URL

const labelPrice = document.getElementById("preco-total");
const labelQuant = document.getElementById("total-produtos");
const checkoutModalBody = document.getElementById("checkoutModalBody");
const confirmCheckoutBtn = document.getElementById("confirmCheckoutBtn");

document.addEventListener('DOMContentLoaded', function() {
    currentMarketId = getCookie('marketId')
    if (currentMarketId) {
        verificSuper(); // Chama verificSuper para buscar o nome do mercado
    } else {
        console.error("ID do Mercado não encontrado na URL para o PDV!");
        window.location.href = '/error404'
        if (confirmCheckoutBtn) { // Verifica se o botão já existe no DOM
            confirmCheckoutBtn.disabled = true;
        }
        // Desabilitar outras funcionalidades do PDV se necessário
        if(codigoInput) codigoInput.disabled = true;
    }
    init(); // Sua função de inicialização
});

function toggleSearch() {
    const container = document.querySelector('.search-container');
    const input = document.getElementById('pesquisaInput');
    
    if (!container || !input) return; // Adiciona verificação

    if (container.classList.contains('active')) {
        input.value = '';
        filtrarProdutos('');
    }
    container.classList.toggle('active');
    if (container.classList.contains('active')) {
        input.focus();
    }
}

const pesquisaInputEl = document.getElementById('pesquisaInput');
if (pesquisaInputEl) {
    pesquisaInputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const valorBusca = this.value.trim();
            // A função searchProducts não está definida neste script, mas filtrarProdutos existe.
            // Se searchProducts deveria chamar uma API, ela precisa ser definida.
            // Por ora, vamos assumir que a intenção era filtrar os produtos já na tela:
            if (valorBusca !== '') {
                filtrarProdutos(valorBusca); // Ou searchProducts(valorBusca) se existir
            } else {
                filtrarProdutos(''); // Limpa o filtro se a busca for vazia
            }
        }
    });
}


function filtrarProdutos(termoBusca) {
    const container = document.getElementById("produtos-container");
    if (!container) return;
    const cards = container.querySelectorAll('.card-produto');
    const termo = termoBusca.trim().toLowerCase();
    
    cards.forEach(card => {
        const productName = card.querySelector('.card-title').textContent.toLowerCase();
        // A ID do card é "card(BARCODE)", então precisamos extrair o barcode corretamente
        const cardId = card.id; // Ex: "card(12345)"
        const barcodeMatch = cardId.match(/card\((.+)\)/);
        const barcode = barcodeMatch ? barcodeMatch[1] : '';
        
        if (termo === '' || productName.includes(termo) || barcode.includes(termo)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}



  
async function verificSuper() {

    if (!currentMarketId) {
        console.error('ID do supermercado não encontrado na URL para verificSuper.');
        showAlert("Supermercado não identificado na URL.", "Erro de Configuração", "error");
        const supermarketNameEl = document.getElementById("supermarket-name");
        if(supermarketNameEl) supermarketNameEl.textContent = "Super Mercado: Não Identificado";
        return;
    }

    try {
        const response = await fetch("/api/supermercados/verify", { // Endpoint correto para verificar supermercado
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({busca: currentMarketId, column: 'marketId', tableSelect: 'supermarkets'}) // Envia o marketId corretamente
        });

        const data = await response.json(); // Lê a resposta JSON

        if (!response.ok) { // Verifica se a requisição HTTP falhou (status não 2xx)
            throw new Error(data.message || data.error || `Erro ${response.status} ao verificar supermercado.`);
        }


        // O backend /verify (corrigido) retorna { success: true, market: {name: "..."} }
        if (data.mensagem) {
            const supermarketName = data.mensagem.name;
            const supermarketNameEl = document.getElementById("supermarket-name");
            if (supermarketNameEl) {
                supermarketNameEl.textContent = "Super Mercado: " + supermarketName;
            }
            // Não precisa redefinir currentMarketId global aqui, ele já foi pego no DOMContentLoaded.
            // Apenas confirma que é válido.
        } else {
            console.error("Falha ao verificar supermercado, resposta do backend:", data);
            const supermarketNameEl = document.getElementById("supermarket-name");
            if(supermarketNameEl) supermarketNameEl.textContent = "Super Mercado: Inválido ou Não Encontrado";
            showAlert(data.message || "Supermercado não encontrado ou resposta inválida.", "Erro de Verificação", "error");
            // window.location.href = '/Error404'; // Descomente se quiser redirecionar
        }
    } catch (err) {
        console.error('Erro na função verificSuper:', { error: err.message, stack: err.stack, marketId: currentMarketId });
        const supermarketNameEl = document.getElementById("supermarket-name");
        if(supermarketNameEl) supermarketNameEl.textContent = "Super Mercado: Erro na Verificação";
        showAlert(`Erro ao verificar dados do supermercado: ${err.message}`, "Erro de Conexão", "error");
    }
}

function init() {
    const globalAlertModalEl = document.getElementById('globalAlertModal');
    if (globalAlertModalEl) { // Só inicializa se o elemento existir
        modalInstance = new bootstrap.Modal(globalAlertModalEl);
    } else {
        console.warn("Modal #globalAlertModal não encontrado. Alguns alertas podem não funcionar.");
    }
    setupEventListeners();
    focusCodigoInput();
    updateTotals();
    loadCartFromCookie();
}

async function loadCartFromCookie() {
    try {
        const response = await fetch('/api/carrinho/getCarrinho'); // GET por padrão
        if (response.ok) {
            const data = await response.json();
            if (data.carrinho && Object.keys(data.carrinho).length > 0) {
                productsOnScreen = data.carrinho;
                document.getElementById("produtos-container").innerHTML = "";
                for (const barcode in productsOnScreen) {
                    // recreateProductCard precisa do productData completo.
                    // Se o cookie só tem partes, pode precisar buscar o resto.
                    // Assumindo que productsOnScreen[barcode].productData é suficiente.
                    if (productsOnScreen[barcode].productData) {
                        await recreateProductCard(productsOnScreen[barcode].productData, productsOnScreen[barcode].quant);
                    } else {
                        console.warn(`Dados do produto ausentes no carrinho para o barcode: ${barcode}`);
                        // Opcional: buscar dados do produto se faltarem
                    }
                }
                updateTotals();
            }
        } else {
            console.error("Erro ao buscar carrinho do cookie:", response.status, await response.text().catch(()=>""));
        }
    } catch (err) {
        console.error('Erro ao carregar carrinho do cookie:', err);
    }
}

// Modificado para aceitar quantidade inicial do carrinho
async function recreateProductCard(productData) {
    // If productData is missing essential fields, fetch it from server
    if (!productData.name || !productData.price) {
        const response = await fetch('/api/supermercados/estoqueData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ busca: productData.barcode, marketId: id })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.mensagem && data.mensagem.length > 0) {
                productData = data.mensagem[0];
            }
        }
    }

    const container = document.getElementById("produtos-container");
    const tempDiv = document.createElement("div");
    const barcode = productData.barcode;

    tempDiv.innerHTML = `
        <div id="card(${barcode})" class="card card-produto" style="border: 1px solid #dee2e6;">
            <div class="row g-0 h-100">
                <div class="col-md-4 p-0 overflow-hidden" style="height: 100%;">
                    <img src="${getImageUrl(productData.image)}" 
                        class="h-100 w-100" 
                        style="object-fit: cover; object-position: center;"
                        alt="${productData.name}"
                        onerror="this.src='https://via.placeholder.com/150?text=Produto'">
                </div>
                <div class="col-md-8 p-0">
                    <div class="card-body h-100">
                        <h6 class="card-title">${productData.name}</h6>
                        <p class="card-text">Preço Total: R$ ${productsOnScreen[barcode].totalPrice.toFixed(2)}</p>
                        <p class="card-text">Qtd: ${productsOnScreen[barcode].quant}</p>
                        <div class="card-actions">
                            <button type="button" class="btn btn-sm btn-outline-secondary btn-popover m-1" 
                                    data-bs-toggle="popover" 
                                    data-bs-html="true"
                                    data-bs-content="
                                        <strong>Nome:</strong> ${productData.name}<br>
                                        <strong>Cód. Barras:</strong> ${barcode}<br>
                                        <strong>Preço:</strong> R$ ${productData.price}<br>
                                        <strong>Categoria:</strong> ${productData.category}<br>
                                        <strong>Estoque:</strong> ${productData.stock} unidades<br>
                                        <strong>Lote:</strong> ${productData.lot}<br>
                                        <strong>Departamento:</strong> ${productData.departament}<br>
                                        <strong>Validade:</strong> ${productData.expirationDate}<br>
                                        <strong>Fabricação:</strong> ${productData.manufactureDate}"
                                    title="Detalhes">
                                <i class="bi bi-info-square"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger m-1" data-bs-toggle="tooltip" data-bs-title="Remover 1 unidade" onclick="removerUnidade('${barcode}')">
                                <i class="bi bi-dash-circle"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger m-1" data-bs-toggle="tooltip" data-bs-title="Remover do estoque" onclick="removerProduto('${barcode}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const cardElement = tempDiv.firstElementChild;
    container.appendChild(cardElement);

    const btnPopover = cardElement.querySelector('.btn-popover');
    new bootstrap.Popover(btnPopover, { trigger: 'focus' });

    const tooltips = cardElement.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(btn => new bootstrap.Tooltip(btn));
}

function getImageUrl(imagePath) {
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
        return 'https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1';
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const normalizedPath = imagePath.replace(/\\/g, '/').replace(/^\/?/, '');
    return `http://localhost:4000/${normalizedPath}`; // Assegure que a porta está correta
}

function focusCodigoInput() {
    if (codigoInput) {
        codigoInput.focus();
        codigoInput.value = ''; // Limpa o input após focar
        // codigoInput.select(); // .select() pode ser irritante se o campo for limpo
    }
}

function setupEventListeners() {
    if (codigoInput) {
        codigoInput.addEventListener("keypress", handleEnterKey);
    }
    const modalConfirmarCompraEl = document.getElementById('modalConfirmarCompra');
    if (modalConfirmarCompraEl) {
        modalConfirmarCompraEl.addEventListener('show.bs.modal', prepareCheckoutModal);
        modalConfirmarCompraEl.addEventListener('hidden.bs.modal', focusCodigoInput);
    }
    if (confirmCheckoutBtn) {
        confirmCheckoutBtn.addEventListener("click", finalizarCompra);
    }
    const modalCancelarCompraEl = document.getElementById('modalCancelarCompra');
    if (modalCancelarCompraEl) {
        modalCancelarCompraEl.addEventListener('hidden.bs.modal', focusCodigoInput);
    }
    initTooltips(); // Para os botões que já existem na página
}

function handleEnterKey(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Evita submissão de formulário, se houver
        AdicionarProdutoNovo();
    }
}

// handleSearch não é usada, mas filtrarProdutos é.
// Se searchProducts for uma função separada que chama API, ela precisa ser definida.

function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(btn => {
        // Evita reinicializar tooltips
        if (!bootstrap.Tooltip.getInstance(btn)) {
            new bootstrap.Tooltip(btn);
        }
    });
}

function showAlert(message, title = 'Aviso', type = 'info') {
    const modalEl = document.getElementById('globalAlertModal');
    if (!modalEl) { console.warn("Modal de alerta global não encontrado."); return; }

    const modalLabel = document.getElementById('globalAlertModalLabel');
    const modalBody = document.getElementById('globalAlertModalBody');
    
    if (!modalLabel || !modalBody) { console.warn("Elementos internos do modal de alerta não encontrados."); return; }

    // Limpa classes de tipo anteriores
    modalEl.classList.remove('modal-warning', 'modal-error', 'modal-success', 'modal-info');

    switch(type.toLowerCase()) {
        case 'warning': modalEl.classList.add('modal-warning'); break;
        case 'error': modalEl.classList.add('modal-error'); break;
        case 'success': modalEl.classList.add('modal-success'); break;
        default: modalEl.classList.add('modal-info'); break;
    }

    modalLabel.textContent = title;
    modalBody.textContent = message;

    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
    instance.show();
}

function updateTotals() {
    totalPrice = 0;
    totalQuantity = 0;
    for (const barcode in productsOnScreen) {
        const product = productsOnScreen[barcode];
        // Garante que productData e price existam e sejam números
        if (product.productData && typeof product.productData.price === 'number' && typeof product.quant === 'number') {
            totalPrice += product.productData.price * product.quant;
            totalQuantity += product.quant;
        }
    }
    if(labelPrice) labelPrice.textContent = totalPrice.toFixed(2);
    if(labelQuant) labelQuant.textContent = totalQuantity;
}

// searchProducts não está definida, mas filtrarProdutos sim.
// Se a intenção é uma busca no backend:
// async function searchProducts(query) { ... fetch ... }

async function AdicionarProdutoNovo() {
    if(!codigoInput) return;
    const code = codigoInput.value.trim();
    if (!code) {
        showAlert("Por favor, insira um código de produto.", "Campo Obrigatório", "warning");
        focusCodigoInput();
        return;
    }

    // currentMarketId já deve estar definido globalmente
    if (!currentMarketId) {
        showAlert("ID do mercado não está definido. Recarregue a página ou verifique a URL.", "Erro de Configuração", "error");
        focusCodigoInput();
        return;
    }

    try {
        const response = await fetch('/api/supermecados/estoqueData', { // Busca o produto no estoque
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ busca: code, marketId: currentMarketId }) // 'busca' é o código/barcode
        });
        const data = await response.json();

        if (!response.ok) {
             throw new Error(data.erro || `Erro ${response.status} ao buscar produto.`);
        }

        if (data.mensagem && data.mensagem.length > 0) {
            const produtoEncontrado = data.mensagem[0];
            if (produtoEncontrado.stock <= 0) {
                showAlert(`Produto "${produtoEncontrado.name}" está sem estoque.`, "Estoque Insuficiente", "warning");
                focusCodigoInput();
                return;
            }
            // Verifica se o produto já está na tela e tem estoque suficiente para adicionar mais um
            if (productsOnScreen[produtoEncontrado.barcode] && productsOnScreen[produtoEncontrado.barcode].quant >= produtoEncontrado.stock) {
                showAlert(`Não há mais estoque disponível para "${produtoEncontrado.name}".`, "Estoque Esgotado", "warning");
                focusCodigoInput();
                return;
            }
            criarCardEstoque(produtoEncontrado); // Adiciona ou incrementa no PDV
            focusCodigoInput(); // Limpa e foca o input
        } else {
            showAlert("Produto não encontrado no estoque deste mercado.", "Não Encontrado", "error");
            focusCodigoInput();
        }
    } catch (err) {
        console.error('Erro ao adicionar produto novo:', err);
        showAlert(`Erro ao buscar produto: ${err.message}`, "Erro de Busca", "error");
        focusCodigoInput();
    }
}

function criarCardEstoque(produto) { // produto vindo do backend
    if (!produto || !produto.barcode) {
        console.error("criarCardEstoque: Dados do produto inválidos", produto);
        return;
    }
    const barcode = produto.barcode;
    const price = parseFloat(produto.price);

    if (isNaN(price)) {
        console.error("criarCardEstoque: Preço inválido para o produto", produto);
        showAlert(`Produto "${produto.name}" com preço inválido.`, "Erro de Dados", "error");
        return;
    }

    if (productsOnScreen[barcode]) { // Produto já na tela, apenas incrementa
        // Verifica estoque antes de incrementar
        if (productsOnScreen[barcode].quant < produto.stock) {
            productsOnScreen[barcode].quant += 1;
            productsOnScreen[barcode].totalPrice = price * productsOnScreen[barcode].quant;
        } else {
            showAlert(`Estoque máximo atingido para "${produto.name}".`, "Aviso", "warning");
            return; // Não adiciona mais se o estoque na tela já iguala o estoque real
        }
        
        const existingCard = document.getElementById(`card(${barcode})`);
        if (existingCard) {
            const priceTextEl = existingCard.querySelector('.card-text:nth-of-type(1)');
            const quantTextEl = existingCard.querySelector('.card-text:nth-of-type(2)');
            if(priceTextEl) priceTextEl.textContent = `Preço Total: R$ ${productsOnScreen[barcode].totalPrice.toFixed(2)}`;
            if(quantTextEl) quantTextEl.textContent = `Qtd: ${productsOnScreen[barcode].quant}`;
        }
    } else { // Produto novo na tela
        if (produto.stock <= 0) { // Não adiciona se já estiver sem estoque
             showAlert(`Produto "${produto.name}" está sem estoque.`, "Estoque Insuficiente", "warning");
             return;
        }
        productsOnScreen[barcode] = {
            totalPrice: price, // Preço total inicial é o preço unitário
            quant: 1,
            productData: { ...produto } // Armazena todos os dados do produto
        };
        // Chama recreateProductCard para criar o visual do card, passando a quantidade inicial 1
        recreateProductCard(produto, 1);
    }
    updateTotals();
    saveCartToCookie();
}

async function saveCartToCookie() {
    try {
        const response = await fetch('/api/carrinho/addCarrinho', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carrinho: productsOnScreen }),
        });
        if (!response.ok) {
            console.error("Falha ao salvar carrinho no cookie:", response.status, await response.text().catch(()=>""));
        }
    } catch (err) {
        console.error('Erro ao salvar carrinho:', err);
    }
}

function removerUnidade(barcode) {
    if (productsOnScreen[barcode]) {
        const productInfo = productsOnScreen[barcode];
        const unitPrice = parseFloat(productInfo.productData.price);
        
        if (productInfo.quant > 1) {
            productInfo.quant -= 1;
            productInfo.totalPrice = unitPrice * productInfo.quant;
            
            const card = document.getElementById(`card(${barcode})`);
            if (card) {
                const priceTextEl = card.querySelector('.card-text:nth-of-type(1)');
                const quantTextEl = card.querySelector('.card-text:nth-of-type(2)');
                if(priceTextEl) priceTextEl.textContent = `Preço Total: R$ ${productInfo.totalPrice.toFixed(2)}`;
                if(quantTextEl) quantTextEl.textContent = `Qtd: ${productInfo.quant}`;
            }
        } else {
            // Se a quantidade é 1, remover o produto inteiro
            removerProduto(barcode);
        }
        updateTotals();
        saveCartToCookie();
    }
}

function removerProduto(barcode) {
    if (productsOnScreen[barcode]) {
        const card = document.getElementById(`card(${barcode})`);
        if (card) {
            card.remove();
        }
        delete productsOnScreen[barcode];
        updateTotals();
        saveCartToCookie();
    }
}

function prepareCheckoutModal() {
    if (!checkoutModalBody) return;
    checkoutModalBody.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Carregando...</span></div></div>`;

    setTimeout(() => {
        if (totalQuantity === 0) {
            checkoutModalBody.innerHTML = `<div class="alert alert-warning text-center"><i class="bi bi-cart-x-fill fs-1"></i><h4 class="mt-3">Carrinho Vazio</h4><p class="mb-0">Adicione produtos</p></div>`;
            if(confirmCheckoutBtn) confirmCheckoutBtn.disabled = true;
        } else {
            let itemsHTML = '';
            let calculatedTotal = 0;
            for (const [barcode, productItem] of Object.entries(productsOnScreen)) {
                // Garante que productData e productData.price existem e são válidos
                if (productItem.productData && typeof productItem.productData.price === 'number' && typeof productItem.quant === 'number') {
                    const itemSubtotal = productItem.productData.price * productItem.quant;
                    calculatedTotal += itemSubtotal;
                    itemsHTML += `<tr><td>${productItem.productData.name || 'Produto desconhecido'}</td><td>${productItem.quant}</td><td>R$ ${itemSubtotal.toFixed(2)}</td></tr>`;
                }
            }
            checkoutModalBody.innerHTML = `
                <div class="checkout-summary">
                    <h5 class="mb-3">Resumo da Compra</h5><div class="table-responsive">
                    <table class="table table-sm"><thead><tr><th>Produto</th><th>Qtd</th><th>Subtotal</th></tr></thead>
                    <tbody id="checkoutItemsList">${itemsHTML}</tbody>
                    <tfoot><tr class="table-active"><th colspan="2">Total</th><th>R$ ${calculatedTotal.toFixed(2)}</th></tr></tfoot>
                    </table></div>
                    <div class="mt-3"><label for="paymentMethodInModal" class="form-label">Método de Pagamento</label>
                    <select class="form-select" id="paymentMethodInModal">
                        <option value="cash">Dinheiro</option><option value="credit">Cartão de Crédito</option>
                        <option value="debit">Cartão de Débito</option><option value="pix">PIX</option>
                    </select></div></div>`;
            if(confirmCheckoutBtn) confirmCheckoutBtn.disabled = false;
        }
    }, 300);
}

async function finalizarCompra() {
    if (totalQuantity === 0) {
        showAlert("Não há produtos no carrinho.", "Carrinho Vazio", "warning");
        return;
    }
    
    const paymentMethodEl = document.getElementById("paymentMethodInModal");
    if (!paymentMethodEl) {
        showAlert("Erro: Elemento de método de pagamento não encontrado.", "Erro Interno", "error");
        return;
    }
    const paymentMethod = paymentMethodEl.value;
    const userId = getCookie("user");
    
    if (!currentMarketId) {
        showAlert("Supermercado não identificado. Não é possível finalizar a compra.", "Erro Crítico", "error");
        return;
    }
    if (!userId) {
        showAlert("Usuário não identificado. Faça login novamente para finalizar a compra.", "Erro de Autenticação", "error");
        return;
    }

    const invoiceItems = [];
    for (const barcode in productsOnScreen) {
        const productItem = productsOnScreen[barcode];
        if (productItem.productData && productItem.productData.productId != null) {
            invoiceItems.push({
                name: productItem.productData.name,
                barcode: barcode,
                productId: productItem.productData.productId, // ID do produto do banco
                unitPrice: parseFloat(productItem.productData.price),
                quantity: productItem.quant,
                subtotal: parseFloat(productItem.totalPrice.toFixed(2))
            });
        } else {
            showAlert(`Dados incompletos para o produto com código ${barcode}. Compra não pode ser finalizada.`, "Erro nos Dados do Produto", "error");
            return; // Interrompe a finalização
        }
    }
    
    currentInvoice = {
        date: new Date().toISOString(),
        items: invoiceItems,
        total: parseFloat(totalPrice.toFixed(2)),
        // quantity: totalQuantity, // A API /finalizarCompra não usa 'quantity' no objeto principal
        paymentMethod: paymentMethod,
        marketId: currentMarketId, // String, como "8ETJ3P"
        userId: parseInt(userId)   // userId como número (o backend espera assim)
    };
    
    try {
        if(confirmCheckoutBtn) confirmCheckoutBtn.disabled = true;
        if(checkoutModalBody) checkoutModalBody.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Processando...</span></div><p>Enviando dados...</p></div>`;

        const response = await fetch('/api/carrinho/finalizarCompra', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentInvoice)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erro ${response.status} ao finalizar compra.`);
        }
        processPayment(); // Chama a função que simula o processamento do pagamento
    } catch (err) {
        console.error('Error finalizing sale:', { error: err.message, stack: err.stack, invoice: currentInvoice });
        if(confirmCheckoutBtn) confirmCheckoutBtn.disabled = false;
        if(checkoutModalBody) checkoutModalBody.innerHTML = `<div class="alert alert-danger"><h5>Erro ao finalizar</h5><p>${err.message}</p><button class="btn btn-sm btn-secondary" onclick="prepareCheckoutModal()">Tentar Novamente</button></div>`;
    }
}

function processPayment() {
    if(confirmCheckoutBtn) confirmCheckoutBtn.style.display = 'none';
    if(checkoutModalBody) checkoutModalBody.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-success mb-3" role="status"><span class="visually-hidden">Processando...</span></div><h5>Processando pagamento...</h5></div>`;
    setTimeout(() => {
        showPaymentSuccess();
    }, 2000);
}

function showPaymentSuccess() {
    const modalFooter = document.querySelector('#modalConfirmarCompra .modal-footer');
    if(modalFooter) modalFooter.innerHTML = ''; // Limpa botões antigos
    
    if(checkoutModalBody) checkoutModalBody.innerHTML = `
        <div class="alert alert-success text-center">
            <i class="bi bi-check-circle-fill fs-1"></i><h4 class="mt-3">Compra concluída!</h4>
            <p>Pagamento via ${getPaymentMethodName(currentInvoice.paymentMethod)} ok.</p>
            <p class="mb-0">Total: R$ ${currentInvoice.total.toFixed(2)}</p>
        </div>`;

    if(modalFooter){
        const printBtn = document.createElement('button');
        printBtn.className = 'btn btn-primary';
        printBtn.innerHTML = '<i class="bi bi-printer-fill"></i> Imprimir Recibo';
        printBtn.onclick = printReceipt;
        modalFooter.appendChild(printBtn);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary ms-2';
        closeBtn.innerHTML = '<i class="bi bi-x-circle-fill"></i> Fechar';
        closeBtn.onclick = completeCheckout;
        modalFooter.appendChild(closeBtn);
    }
}

function completeCheckout() {
    resetCart();
    const modalEl = document.getElementById('modalConfirmarCompra');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
    
    const modalFooter = document.querySelector('#modalConfirmarCompra .modal-footer');
    if(modalFooter) {
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Voltar</button>
            <button type="button" class="btn btn-success" id="confirmCheckoutBtn">
                <i class="bi bi-cart-check-fill"></i> Confirmar
            </button>`;
        // Reatribui o listener ao novo botão de confirmar
        const newConfirmBtn = document.getElementById('confirmCheckoutBtn');
        if (newConfirmBtn) {
            newConfirmBtn.addEventListener('click', finalizarCompra);
            newConfirmBtn.style.display = ''; // Garante que está visível
        }
    }
    focusCodigoInput();
}

function resetCart() {
    productsOnScreen = {};
    totalPrice = 0;
    totalQuantity = 0;
    const produtosContainer = document.getElementById("produtos-container");
    if(produtosContainer) produtosContainer.innerHTML = "";
    updateTotals();
    
    // Limpar cookie do carrinho no servidor
    fetch('/api/carrinho/addCarrinho', { // Envia um carrinho vazio para "limpar" o cookie
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrinho: {} }),
    }).catch(err => console.error('Erro ao limpar carrinho no servidor:', err));
}

function printReceipt() {
    if (!currentInvoice) {
        showAlert("Nenhuma informação de compra para imprimir.", "Aviso", "warning");
        return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>Recibo Supermercado Didático</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { padding: 20px; font-family: 'Courier New', Courier, monospace; font-size: 12px; }
            .receipt-header { text-align: center; margin-bottom: 15px; }
            .receipt-title { font-weight: bold; font-size: 16px; }
            .receipt-info { font-size: 10px; color: #333; }
            table { width: 100%; margin-bottom: 10px; border-collapse: collapse; }
            th, td { padding: 2px 0; text-align: left; }
            th { border-bottom: 1px dashed #666; }
            .text-end { text-align: right !important; }
            .total-row td { font-weight: bold; border-top: 1px dashed #666; padding-top: 5px;}
            .footer-message { text-align: center; margin-top: 15px; font-size: 10px; }
            @media print { body { margin: 0; -webkit-print-color-adjust: exact; } }
        </style></head><body>
            <div class="receipt-header">
                <div class="receipt-title">Super Mercado Didático</div>
                <div class="receipt-info">CNPJ: XX.XXX.XXX/0001-XX</div>
                <div class="receipt-info">Av. Exemplo, 123 - Centro</div>
                <div class="receipt-info">Data: ${new Date(currentInvoice.date).toLocaleString('pt-BR')}</div>
            </div>
            <div>--------------------------------------------------</div>
            <div>CUPOM FISCAL ELETRÔNICO SAT</div>
            <div>--------------------------------------------------</div>
            <table><thead><tr><th>Item</th><th>Qtd.</th><th class="text-end">Vl. Unit.</th><th class="text-end">Total</th></tr></thead>
            <tbody>
            ${currentInvoice.items.map(item => `
                <tr>
                    <td colspan="4">${item.name} (Cód: ${item.barcode})</td>
                </tr>
                <tr>
                    <td></td>
                    <td>${item.quantity} UN x</td>
                    <td class="text-end">R$ ${item.unitPrice.toFixed(2)}</td>
                    <td class="text-end">R$ ${item.subtotal.toFixed(2)}</td>
                </tr>`).join('')}
            </tbody></table>
            <div>--------------------------------------------------</div>
            <table><tbody>
                <tr class="total-row"><td colspan="3">TOTAL</td><td class="text-end">R$ ${currentInvoice.total.toFixed(2)}</td></tr>
                <tr><td colspan="3">Forma Pagto.</td><td class="text-end">${getPaymentMethodName(currentInvoice.paymentMethod)}</td></tr>
            </tbody></table>
            <div>--------------------------------------------------</div>
            <div class="footer-message">Volte Sempre!</div>
        <script> setTimeout(() => { window.print(); setTimeout(window.close, 300); }, 250); </script>
        </body></html>`);
    printWindow.document.close();
}

function getPaymentMethodName(method) {
    switch(method) {
        case 'cash': return 'Dinheiro';
        case 'credit': return 'Cartão de Crédito';
        case 'debit': return 'Cartão de Débito';
        case 'pix': return 'PIX';
        default: return method;
    }
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let c of ca) {
    c = c.trim();
    if (c.indexOf(name) === 0) {
        return c.substring(name.length);
    }
    }
    return "";
}

function confirmarCancelamento() {
    const senhaInput = document.getElementById("senhaCancelamento");
    if (!senhaInput) return;
    const senha = senhaInput.value;
    const erroSenhaEl = document.getElementById("erroSenha");

    if (senha === "admin") { // Senha para cancelar
        resetCart();
        showAlert("Compra cancelada com sucesso!", "Cancelamento", "success");
        if(erroSenhaEl) erroSenhaEl.classList.add("d-none");
        senhaInput.value = ''; // Limpa a senha
        
        const modalEl = document.getElementById('modalCancelarCompra');
        if(modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        focusCodigoInput();
    } else {
        if(erroSenhaEl) erroSenhaEl.classList.remove("d-none");
        // showAlert("Senha incorreta. Tente novamente.", "Erro de Senha", "error"); // showAlert pode ser muito intrusivo aqui
        senhaInput.focus();
    }
}

// Já existe um DOMContentLoaded no início do script, não precisa de outro.
// A chamada init() já está lá.