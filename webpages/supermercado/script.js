const produtos = [];

// Gerando 30 produtos de exemplo
for (let i = 1; i <= 30; i++) {
  produtos.push({
    nome: "Produto " + i,
    codigo: "00" + i,
    setor: ["Bebidas", "Alimentos", "Higiene", "Limpeza", "Utilidades"][i % 5],
    estante: "E" + (i % 4 + 1),
    preco: "R$ " + (Math.random() * 10 + 5).toFixed(2),
    quantidade: Math.floor(Math.random() * 100 + 1)
  });
}

const container = document.getElementById("produtos-container");

produtos.forEach((produto, index) => {
  const cardHTML = `
    <div class="card-produto">
      <div class="imagem-produto">IMG</div>
      <div class="info-produto">
        <div><strong>Nome:</strong> ${produto.nome}</div>
        <div><strong>Cód:</strong> ${produto.codigo}</div>
        <div><strong>Setor:</strong> ${produto.setor}</div>
        <div><strong>Est:</strong> ${produto.estante}</div>
        <button type="button" class="btn btn-light btn-sm" 
                data-bs-toggle="popover"
                title="Detalhes"
                data-bs-html="true"
                data-bs-content="
                  <strong>Nome:</strong> ${produto.nome}<br>
                  <strong>Código:</strong> ${produto.codigo}<br>
                  <strong>Setor:</strong> ${produto.setor}<br>
                  <strong>Estante:</strong> ${produto.estante}<br>
                  <strong>Preço:</strong> ${produto.preco}<br>
                  <strong>Qtd:</strong> ${produto.quantidade} unidades">
          Ver mais
        </button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", cardHTML);
});

// Ativando popovers
const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
popoverTriggerList.forEach(el => new bootstrap.Popover(el));
    