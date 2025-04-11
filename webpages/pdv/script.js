function criarCardEstoque(produto) {
  const container = document.getElementById("produtos-container");
  const tempDiv = document.createElement("div");

  tempDiv.innerHTML = `
    <div id="card(${produto.barcode})" class="card-hover card card-produto h-100" style="border-radius: 10px; overflow: hidden;">
      <img src="${produto.imagem}" class="card-img-top" alt="${produto.name}" style="height: 100px; object-fit: cover;">
      <div class="card-body d-flex flex-column p-2 bg-light">
        <h6 class="card-title mb-1">${produto.name}</h6>
        <p class="small text-muted mb-1">Preço: R$ ${produto.price.toFixed(2)}</p>
        <p class="small text-muted mb-2">Qtd: ${produto.stock}</p>
        <div class="mt-auto d-flex flex-row-reverse">
          <button type="button" class="btn btn-sm btn-outline-secondary btn-popover m-1" 
                  data-bs-toggle="popover" 
                  data-bs-html="true"
                  data-bs-content="
                    <strong>Nome:</strong> ${produto.name}<br>
                    <strong>Cód. Barras:</strong> ${produto.barcode}<br>
                    <strong>Preço:</strong> R$ ${produto.price.toFixed(2)}<br>
                    <strong>Categoria:</strong> ${produto.category}<br>
                    <strong>Estoque:</strong> ${produto.stock} unidades<br>
                    <strong>Lote:</strong> ${produto.lot}<br>
                    <strong>Departamento:</strong> ${produto.department}<br>
                    <strong>Validade:</strong> ${produto.expirationDate}<br>
                    <strong>Fabricação:</strong> ${produto.manufactureDate}"
                  title="Detalhes">
            <i class="bi bi-info-square"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger m-1" data-bs-toggle="tooltip" data-bs-title="Remover 1 unidade">
            <i class="bi bi-dash-circle"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger m-1" data-bs-toggle="tooltip" data-bs-title="Remover do estoque">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const cardElement = tempDiv.firstElementChild;
  container.appendChild(cardElement);

  // Ativar apenas os elementos desse card
  const btnPopover = cardElement.querySelector('.btn-popover');
  const tooltips = cardElement.querySelectorAll('[data-bs-toggle="tooltip"]');

  new bootstrap.Popover(btnPopover, {
    trigger: 'focus'
  });

  tooltips.forEach(btn => new bootstrap.Tooltip(btn));
}

for (let index = 0; index < 12; index++) {
  const produtoExemplo = {
    name: "Leite Integral",
    barcode: "7891234567890",
    price: 5.49,
    stock: 42,
    category: "Laticínios",
    lot: "A1B2C3",
    department: "Refrigerados",
    expirationDate: "10/05/2025",
    manufactureDate: "10/03/2025",
    imagem: "https://via.placeholder.com/150"
  };
  
  criarCardEstoque(produtoExemplo);
}
