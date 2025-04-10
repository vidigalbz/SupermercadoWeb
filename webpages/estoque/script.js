const container = document.getElementById("produtos-container");

function criarCardHTML(produto, container) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = `
    <div class="card-produto d-flex mb-3" style="border-radius: 10px; overflow: hidden;">
      <div class="imagem-produto" style="background-image: url('${produto.imagem}'); width: 120px; background-size: cover;">
      </div>
      <div class="info-produto p-2 text-white" style="background-color: #009cbf; flex: 1;">
        <div><strong>Nome:</strong> ${produto.name}</div>
        <div><strong>Cód. de Barras:</strong> ${produto.barcode}</div>
        <div class="mt-2 d-flex gap-2">
          <button type="button" class="btn btn-light btn-sm btn-copiar" 
                  data-bs-toggle="tooltip" 
                  data-bs-placement="top" 
                  title="Copiar código de barras">
            <i class="bi bi-clipboard"></i>
          </button>
          <button type="button" class="btn btn-light btn-sm btn-popover"
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
                    <strong>Fabricação:</strong> ${produto.manufactureDate}"
                  title="Ver mais detalhes">
            <i class="bi bi-info-circle"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const cardElement = tempDiv.firstElementChild;
  container.appendChild(cardElement);

  // Ativa tooltip e popover apenas para os elementos desse card
  const btnCopiar = cardElement.querySelector('.btn-copiar');
  const btnPopover = cardElement.querySelector('.btn-popover');

  new bootstrap.Tooltip(btnCopiar);
  new bootstrap.Popover(btnPopover, {
    trigger: 'focus' // <-- faz o popover fechar ao clicar fora
  });

  btnCopiar.addEventListener('click', () => {
    navigator.clipboard.writeText(produto.barcode).then(() => {
      btnCopiar.innerHTML = '<i class="bi bi-check-lg"></i>';
      btnCopiar.setAttribute('title', 'Copiado!');
      const tooltip = bootstrap.Tooltip.getInstance(btnCopiar);
      tooltip.setContent({ '.tooltip-inner': 'Copiado!' });
      tooltip.show();

      setTimeout(() => {
        btnCopiar.innerHTML = '<i class="bi bi-clipboard"></i>';
        btnCopiar.setAttribute('title', 'Copiar código de barras');
        tooltip.setContent({ '.tooltip-inner': 'Copiar código de barras' });
      }, 2000);
    });
  });
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