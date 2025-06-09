const filterCategoria = document.getElementById("filtro-categoria");
document.addEventListener("DOMContentLoaded", async () => {
    try{ 
      fetch("/getAlerts", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({busca: id, column: "marketId", tableSelect :"supermarkets"})
  }).then(res => res.json())
  .then(data => {
      exibirProdutos(data.sucesso,"vencimento_produtos","");
    

   })
  .catch(err => console.error('Error:', err));
    }
  catch (e){
    console.error('Error:', err)


  }});
 
function getQueryParam(paramName) {
  const queryString = window.location.search.substring(1);
  const params = queryString.split('&');
  if(params.length <= 0 || params == ''){
      window.location.href = '/Error404'
  }
  for (const param of params) {
    const [key, value] = param.split('=');
    if (key === paramName) {
      return decodeURIComponent(value || '');
    }
  }
  return null;
}

const id = getQueryParam('id');
 filterCategoria.addEventListener("change", () => {
  categoriaValue = filterCategoria.value;
  console.log(categoriaValue);
  const valorBusca = document.getElementById("pesquisa").value.trim();
  fetch('/estoqueData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: categoriaValue, marketId: id })
  })
    .then(res => res.json())
    .then(data => {
      renderizarProdutos(data.mensagem);
    })
    .catch(err => console.error('Erro:', err));
})
async function exibirProdutos(lista, idContainer,data) {
      const container = document.getElementById(idContainer);
      container.innerHTML = "";
      var time = Date.now();
      const time = time.toLocaleDateString()

 
      if (!lista || lista.length === 0) {
        container.innerHTML = "<p>Nenhum produto encontardo </p>";
        return;
      }
      lista.forEach(produto => {
          const div = document.createElement("div");

       
        const dataTimestamp = new Date(produto.expirationDate).getTime();
        const agora = Date.now();
        const quinzeDias = data ??15 * 24 * 60 * 60 * 1000; // 15 dias em milissegundos

        if (dataTimestamp <= agora) {
          div.style.backgroundColor = "rgb(248, 89, 89)"; // Vencido
        } else if (dataTimestamp <= agora + quinzeDias) {
          div.style.backgroundColor = "#FDE68A"; // Perto de vencer
        } else {
          div.style.backgroundColor = "#A7F3D0"; // OK
        }
        
        div.className = "mb-3 p-3 border rounded shadow-sm bg-white";
        const dataVal = new Date(produto.expirationDate).toLocaleDateString("pt-BR");
 
        div.innerHTML = `
          <h5>${produto.name}</h5>
          <p><strong>Validade:</strong> ${dataVal}</p>
          <p><strong>Estoque:</strong> ${produto.stock}</p>
          <p><strong>Lote:</strong> ${produto.lot}</p>
        `;
 
        container.appendChild(div);
      });
    }
async  function filtroProdutos(categoria,tipo,datas){
     try{ 
      fetch("/getAlerts", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({busca: id, column: "marketId", tableSelect :"supermarkets"})
  }).then(res => res.json())
  .then(data => {
      exibirProdutos(data.sucesso,"vencimento_produtos",datas ?? "");
    

   })
  .catch(err => console.error('Error:', err));
    }
  catch (e){
    console.error('Error:', err)


  }};
 

