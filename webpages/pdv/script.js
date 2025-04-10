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