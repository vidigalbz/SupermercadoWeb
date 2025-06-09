 
 document.addEventListener("DOMContentLoaded", async () => {
      try {
        const res = await fetch("/api/produtos-vencimento");
        const data = await res.json();
 
        exibirProdutos(data.vermelho, "vencidos");
        exibirProdutos(data.amarelo, "quaseVencendo");
        exibirProdutos(data.verde, "validos");
 
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    });
 
    function exibirProdutos(lista, idContainer) {
      const container = document.getElementById(idContainer);
      container.innerHTML = "";
 
      if (!lista || lista.length === 0) {
        container.innerHTML = "<p>Nenhum produto nesta categoria.</p>";
        return;
      }
 
      lista.forEach(produto => {
        const div = document.createElement("div");
        div.className = "mb-3 p-3 border rounded shadow-sm bg-white";
 
        const dataVal = new Date(produto.expirationDate).toLocaleDateString("pt-BR");
 
        div.innerHTML = `
          <h5>${produto.name}</h5>
          <p><strong>Validade:</strong> ${dataVal}</p>
          <p><strong>Estoque:</strong> ${produto.stock}</p>
        `;
 
        container.appendChild(div);
      });
    }