const { select } = require("../../servidor/database");


  
async function comprarDoFornecedor(event) {
  event.preventDefault(); // para evitar que o form recarregue a página

  const cnpj = document.getElementById("cnpj").value;
  const productId = document.getElementById("productId").value;
  const quantidade = parseInt(document.getElementById("quantidade_produto").value);
  const dataCompra = document.getElementById("data_compra").value;
  const precoUnitario = parseFloat(document.getElementById("preco_unitario").value);
  const subtotal = parseFloat(document.getElementById("subtotal_produto").value);
  const valorFinal = parseFloat(document.getElementById("valor_final").value);

  const dados = {
    cnpj,
    productId,
    quantidade_produto: quantidade,
    data_compra: dataCompra,
    preco_unitario: precoUnitario,
    subtotal_produto: subtotal,
    valor_final: valorFinal
  };

  try {
    const res = await fetch("/comprardofornecedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const resultado = await res.json();

    if (res.ok) {
      alert("Compra registrada com sucesso!");
      event.target.reset(); // limpa o formulário
    } else {
      alert("Erro: " + (resultado.erro || "Erro desconhecido"));
    }
  } catch (err) {
    alert("Erro na requisição: " + err.message);
  }
}

// Associa o listener chamando a função
document.getElementById("formAddFornecedor")
  .addEventListener("submit", comprarDoFornecedor);