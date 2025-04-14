// Global variables
let productsOnScreen = {};
let totalPrice = 0;
let totalQuantity = 0;
let currentInvoice = null;
let modalInstance = null;

// DOM elements
const labelPrice = document.getElementById("preco-total");
const labelQuant = document.getElementById("total-produtos");
const checkoutModalBody = document.getElementById("checkoutModalBody");
const confirmCheckoutBtn = document.getElementById("confirmCheckoutBtn");

// Initialize the application
function init() {
    // Initialize modal instance
    modalInstance = new bootstrap.Modal(document.getElementById('globalAlertModal'));
    
    // Setup event listeners
    setupEventListeners();
    
    // Update totals
    updateTotals();
}

// Setup event listeners
function setupEventListeners() {
    const codigoInput = document.getElementById("codigoProdutoInput");
    const searchInput = document.querySelector('.input-group input[placeholder="Pesquisar produto"]');
    const checkoutModal = document.getElementById('modalConfirmarCompra');
    
    codigoInput.addEventListener("keypress", handleEnterKey);
    searchInput.addEventListener("input", handleSearch);
    checkoutModal.addEventListener('show.bs.modal', prepareCheckoutModal);
    confirmCheckoutBtn.addEventListener("click", finalizarCompra);

    // Initialize tooltips
    initTooltips();
}

function handleEnterKey(event) {
    if (event.key === "Enter") {
        AdicionarProdutoNovo();
    }
}

function handleSearch(e) {
    searchProducts(e.target.value);
}

function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(btn => {
        new bootstrap.Tooltip(btn);
    });
}

function showAlert(message, title = 'Aviso', type = 'info') {
    const modal = document.getElementById('globalAlertModal');
    const modalLabel = document.getElementById('globalAlertModalLabel');
    const modalBody = document.getElementById('globalAlertModalBody');
    
    modal.classList.remove('modal-warning', 'modal-error', 'modal-success');
    
    switch(type.toLowerCase()) {
        case 'warning':
            modal.classList.add('modal-warning');
            break;
        case 'error':
            modal.classList.add('modal-error');
            break;
        case 'success':
            modal.classList.add('modal-success');
            break;
    }
    
    modalLabel.textContent = title;
    modalBody.textContent = message;
    modalInstance.show();
}

function updateTotals() {
    totalPrice = 0;
    totalQuantity = 0;
    
    for (const barcode in productsOnScreen) {
        const product = productsOnScreen[barcode];
        const price = parseFloat(product.productData.price);
        totalPrice += price * product.quant;
        totalQuantity += product.quant;
    }
    
    labelPrice.textContent = totalPrice.toFixed(2);
    labelQuant.textContent = totalQuantity;
}

function searchProducts(query) {
    const container = document.getElementById("produtos-container");
    const cards = container.querySelectorAll('.card-produto');
    
    cards.forEach(card => {
        const productName = card.querySelector('.card-title').textContent.toLowerCase();
        const barcode = card.id.replace('card(', '').replace(')', '');
        
        if (productName.includes(query.toLowerCase()) || barcode.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function AdicionarProdutoNovo() {
    const code = document.getElementById("codigoProdutoInput").value.trim();
    if (!code) {
        showAlert("Por favor, insira um código de produto", "Campo obrigatório", "warning");
        return;
    }
    
    // Simulate API request
    fetch('/estoqueData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busca: code })
    })
    .then(res => res.json())
    .then(data => {
        if (data.mensagem && data.mensagem.length > 0) {
            data.mensagem.forEach(produto => {
                criarCardEstoque(produto);
            });
            document.getElementById("codigoProdutoInput").value = "";
        } else {
            showAlert("Produto não encontrado!", "Erro na busca", "error");
        }
    })
    .catch(err => {
        console.error('Erro ao carregar produtos:', err);
        showAlert("Erro ao buscar produto. Verifique o código e tente novamente.", "Erro", "error");
    });
}

function criarCardEstoque(produto) {
    const barcode = produto.barcode;
    const price = parseFloat(produto.price);

    if (productsOnScreen[barcode]) {
        productsOnScreen[barcode].quant += 1;
        productsOnScreen[barcode].totalPrice = price * productsOnScreen[barcode].quant;
        
        const existingCard = document.getElementById(`card(${barcode})`);
        if (existingCard) {
            existingCard.querySelector('.card-text:nth-of-type(1)').textContent = 
                `Preço Total: R$ ${productsOnScreen[barcode].totalPrice.toFixed(2)}`;
            existingCard.querySelector('.card-text:nth-of-type(2)').textContent = 
                `Qtd: ${productsOnScreen[barcode].quant}`;
            updateTotals();
            return;
        }
    } else {
        productsOnScreen[barcode] = {
            "totalPrice": price,
            "quant": 1,
            "productData": produto
        };
    }
    
    const container = document.getElementById("produtos-container");
    const tempDiv = document.createElement("div");

    tempDiv.innerHTML = `
        <div id="card(${produto.barcode})" class="card card-produto">
            <div class="row g-0 h-100">
                <div class="col-md-4">
                    <img src="${produto.imagem}" class="card-img" alt="${produto.name}" onerror="this.src='https://via.placeholder.com/150?text=Produto'">
                </div>
                <div class="col-md-8">
                    <div class="card-body">
                        <h6 class="card-title">${produto.name}</h6>
                        <p class="card-text">Preço Total: R$ ${productsOnScreen[barcode].totalPrice.toFixed(2)}</p>
                        <p class="card-text">Qtd: ${productsOnScreen[barcode].quant}</p>
                        <div class="card-actions">
                            <button type="button" class="btn btn-sm btn-outline-secondary btn-popover m-1" 
                                    data-bs-toggle="popover" 
                                    data-bs-html="true"
                                    data-bs-content="
                                        <strong>Nome:</strong> ${produto.name}<br>
                                        <strong>Cód. Barras:</strong> ${produto.barcode}<br>
                                        <strong>Preço:</strong> R$ ${produto.price}<br>
                                        <strong>Categoria:</strong> ${produto.category}<br>
                                        <strong>Estoque:</strong> ${produto.stock} unidades<br>
                                        <strong>Lote:</strong> ${produto.lot}<br>
                                        <strong>Departamento:</strong> ${produto.department}<br>
                                        <strong>Validade:</strong> ${produto.expirationDate}<br>
                                        <strong>Fabricação:</strong> ${produto.manufactureDate}"
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

    // Initialize popover and tooltips
    const btnPopover = cardElement.querySelector('.btn-popover');
    new bootstrap.Popover(btnPopover, { trigger: 'focus' });

    const tooltips = cardElement.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(btn => new bootstrap.Tooltip(btn));
    
    updateTotals();
}

function removerUnidade(barcode) {
    if (productsOnScreen[barcode]) {
        const product = productsOnScreen[barcode];
        const price = parseFloat(product.productData.price);
        
        if (product.quant > 1) {
            product.quant -= 1;
            product.totalPrice = price * product.quant;
            
            const card = document.getElementById(`card(${barcode})`);
            if (card) {
                card.querySelector('.card-text:nth-of-type(1)').textContent = 
                    `Preço Total: R$ ${product.totalPrice.toFixed(2)}`;
                card.querySelector('.card-text:nth-of-type(2)').textContent = 
                    `Qtd: ${product.quant}`;
            }
        } else {
            removerProduto(barcode);
        }
        
        updateTotals();
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
    }
}

function prepareCheckoutModal() {
    checkoutModalBody.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
        </div>
    `;

    setTimeout(() => {
        if (totalQuantity === 0) {
            checkoutModalBody.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="bi bi-cart-x-fill fs-1"></i>
                    <h4 class="mt-3">Carrinho Vazio</h4>
                    <p class="mb-0">Adicione produtos antes de finalizar a compra</p>
                </div>
            `;
            confirmCheckoutBtn.disabled = true;
        } else {
            let itemsHTML = '';
            let calculatedTotal = 0;
            
            for (const [barcode, product] of Object.entries(productsOnScreen)) {
                const productTotal = parseFloat(product.productData.price) * product.quant;
                calculatedTotal += productTotal;
                
                itemsHTML += `
                    <tr>
                        <td>${product.productData.name}</td>
                        <td>${product.quant}</td>
                        <td>R$ ${productTotal.toFixed(2)}</td>
                    </tr>
                `;
            }

            checkoutModalBody.innerHTML = `
                <div class="checkout-summary">
                    <h5 class="mb-3">Resumo da Compra</h5>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Qtd</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody id="checkoutItemsList">
                                ${itemsHTML}
                            </tbody>
                            <tfoot>
                                <tr class="table-active">
                                    <th colspan="2">Total</th>
                                    <th>R$ ${calculatedTotal.toFixed(2)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="mt-3">
                        <label for="paymentMethod" class="form-label">Método de Pagamento</label>
                        <select class="form-select" id="paymentMethodInModal">
                            <option value="cash">Dinheiro</option>
                            <option value="credit">Cartão de Crédito</option>
                            <option value="debit">Cartão de Débito</option>
                            <option value="pix">PIX</option>
                        </select>
                    </div>
                </div>
            `;
            
            confirmCheckoutBtn.disabled = false;
        }
    }, 300);
}

function finalizarCompra() {
    if (totalQuantity === 0) {
        showAlert("Não há produtos no carrinho", "Carrinho vazio", "warning");
        return;
    }
    
    const paymentMethod = document.getElementById("paymentMethodInModal").value;
    
    currentInvoice = {
        date: new Date().toLocaleString(),
        items: [],
        total: totalPrice,
        quantity: totalQuantity,
        paymentMethod: paymentMethod
    };

    for (const barcode in productsOnScreen) {
        const product = productsOnScreen[barcode];
        currentInvoice.items.push({
            name: product.productData.name,
            barcode: barcode,
            unitPrice: parseFloat(product.productData.price),
            quantity: product.quant,
            subtotal: parseFloat(product.totalPrice)
        });
    }
    
    processPayment();
}

function processPayment() {
  // Remove the Confirmar button during processing
  const confirmBtn = document.getElementById("confirmCheckoutBtn");
  confirmBtn.style.display = 'none';
  
  // Show processing state
  checkoutModalBody.innerHTML = `
      <div class="text-center py-4">
          <div class="spinner-border text-success mb-3" role="status">
              <span class="visually-hidden">Processando...</span>
          </div>
          <h5>Processando pagamento...</h5>
      </div>
  `;
  
  setTimeout(() => {
      showPaymentSuccess();
  }, 2000);
}

function showPaymentSuccess() {
  // Get modal footer and clear it
  const modalFooter = document.querySelector('#modalConfirmarCompra .modal-footer');
  modalFooter.innerHTML = '';
  
  // Update modal body with success message
  checkoutModalBody.innerHTML = `
      <div class="alert alert-success text-center">
          <i class="bi bi-check-circle-fill fs-1"></i>
          <h4 class="mt-3">Compra concluída!</h4>
          <p>Pagamento realizado com sucesso via ${getPaymentMethodName(currentInvoice.paymentMethod)}</p>
          <p class="mb-0">Total: R$ ${currentInvoice.total.toFixed(2)}</p>
      </div>
  `;

  // Add print button
  const printBtn = document.createElement('button');
  printBtn.className = 'btn btn-primary';
  printBtn.innerHTML = '<i class="bi bi-printer-fill"></i> Imprimir Recibo';
  printBtn.onclick = printReceipt;
  modalFooter.appendChild(printBtn);

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-secondary ms-2';
  closeBtn.innerHTML = '<i class="bi bi-x-circle-fill"></i> Fechar';
  closeBtn.onclick = completeCheckout;
  modalFooter.appendChild(closeBtn);
}

function completeCheckout() {
  resetCart();
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarCompra'));
  modal.hide();
  
  // Restore original footer buttons
  const modalFooter = document.querySelector('#modalConfirmarCompra .modal-footer');
  modalFooter.innerHTML = `
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Voltar</button>
      <button type="button" class="btn btn-success" id="confirmCheckoutBtn">
          <i class="bi bi-cart-check-fill"></i> Confirmar
      </button>
  `;
  
  // Reattach event listener to Confirmar button
  document.getElementById('confirmCheckoutBtn').addEventListener('click', finalizarCompra);
}
function resetCart() {
    productsOnScreen = {};
    totalPrice = 0;
    totalQuantity = 0;
    document.getElementById("produtos-container").innerHTML = "";
    updateTotals();
}

function printReceipt() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Recibo</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { padding: 20px; font-size: 14px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-title { font-weight: bold; font-size: 18px; }
                    .receipt-date { font-size: 12px; color: #666; }
                    table { width: 100%; margin-bottom: 15px; }
                    th { text-align: left; border-bottom: 1px solid #ddd; }
                    td { padding: 3px 0; }
                    .total-row { font-weight: bold; border-top: 1px solid #ddd; }
                    .thank-you { text-align: center; margin-top: 20px; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <div class="receipt-title">Super Mercado Didático</div>
                    <div class="receipt-date">${currentInvoice.date}</div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qtd</th>
                            <th>Preço</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentInvoice.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>R$ ${item.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="2">Total</td>
                            <td>R$ ${currentInvoice.total.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="2">Pagamento</td>
                            <td>${getPaymentMethodName(currentInvoice.paymentMethod)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="thank-you">Obrigado pela sua compra!</div>
                
                <script>
                    setTimeout(() => {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }, 200);
                </script>
            </body>
        </html>
    `);
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

function confirmarCancelamento() {
    const senha = document.getElementById("senhaCancelamento").value;
    if (senha === "admin") {
        resetCart();
        showAlert("Compra cancelada com sucesso", "Cancelamento", "success");
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalCancelarCompra'));
        modal.hide();
    } else {
        document.getElementById("erroSenha").classList.remove("d-none");
        showAlert("Senha incorreta. Tente novamente.", "Erro", "error");
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);