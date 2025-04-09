const container = document.getElementById("produtos-container");

function criarCardHTML(produto, container) {
  const cardHTML = `
    <div class="card-produto d-flex mb-3" style="border-radius: 10px; overflow: hidden;">
      <div class="imagem-produto" style="background-image: url('${produto.imagem}');">
      </div>
      <div class="info-produto p-2 text-white" style="background-color: #009cbf; flex: 1;">
        <div><strong>Nome:</strong> ${produto.name}</div>
        <div><strong>Cód. de Barras:</strong> ${produto.barcode}</div>
        <button type="button" class="btn btn-light btn-sm mt-2" 
                data-bs-toggle="popover"
                title="Detalhes"
                data-bs-html="true"
                data-bs-content="
                  <strong>Nome:</strong> ${produto.name}<br>
                  <strong>Código de Barras:</strong> ${produto.barcode}<br>
                  <strong>Preço:</strong> R$ ${produto.price.toFixed(2)}<br>
                  <strong>Categoria:</strong> ${produto.category}<br>
                  <strong>Estoque:</strong> ${produto.stock} unidades<br>
                  <strong>Lote:</strong> ${produto.lot}<br>
                  <strong>Departamento:</strong> ${produto.department}<br>
                  <strong>Validade:</strong> ${produto.expirationDate}<br>
                  <strong>Fabricação:</strong> ${produto.manufactureDate}">
          Ver mais
        </button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", cardHTML);

  // Ativa o popover do botão recém-criado
  const popoverTrigger = container.querySelector('[data-bs-toggle="popover"]:last-child');
  new bootstrap.Popover(popoverTrigger);
}

//exemplo
function teste() {
  for (let index = 0; index < 30; index++) {
    const produto = {
      name: "Arroz Tio João",
      barcode: "7891234567890",
      price: 24.90,
      category: "Alimentos",
      stock: 50,
      lot: "L23A",
      department: "Mercearia",
      expirationDate: "2025-05-01",
      manufactureDate: "2024-04-01",
      imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/800px-Placeholder_view_vector.svg.png"
    };
    
    criarCardHTML(produto, container);
  }
}

window.onload = teste();