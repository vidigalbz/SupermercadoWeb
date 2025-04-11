function adicionarProduto() {
    const input = document.getElementById("codigoProdutoInput");
    const codigo = input.value.trim();
    if (!codigo) {
      alert("Digite o código do produto!");
      return;
    }

    // Substitua este alert pela lógica real de adicionar o produto
    alert(`Produto com código '${codigo}' adicionado!`);

    input.value = ""; // limpa o campo após adicionar
  }

  function criarCardsProdutosFixos(qtd) {
    const container = document.getElementById('produtos-container');
    container.innerHTML = '';
  
    for (let i = 1; i <= qtd; i++) {
      const cardWrapper = document.createElement('div');
      cardWrapper.className = "col-6 col-sm-4 col-md-3 col-xxl-2 mb-4";
  
      const cardHTML = `
        <div class="card shadow-sm h-100 card-animado">
          <img src="not-found.png" class="card-img-top" alt="Produto ${i}" style="height: 120px; object-fit: cover;">
          <div class="card-body d-flex flex-column p-2">
            <h6 class="card-title mb-1">Produto ${i}</h6>
            <p class="card-text small text-muted mb-2">Descrição do produto ${i}</p>
            <div class="mt-auto d-flex justify-content-between">
              <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-dash-circle"></i></button>
              <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      `;
  
      cardWrapper.innerHTML = cardHTML;
      container.appendChild(cardWrapper);
    }
  }
  
  // Chamar a função com quantidade fixa
  document.addEventListener("DOMContentLoaded", () => {
    criarCardsProdutosFixos(12);
  });
  