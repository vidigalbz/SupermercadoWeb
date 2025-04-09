function adicionarSupermercado() {
  document.getElementById("telaInicial").classList.add("d-none");
  document.getElementById("formularioContainer").classList.remove("d-none");
}

function copiarLink(idInput) {
  const input = document.getElementById(idInput);
  input.select();
  input.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("Link copiado!");
}

const form = document.getElementById('form-supermercado');
const tabela = document.querySelector('#tabela-supermercados tbody');
let id = 1;

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('nomeSupermercado').value.trim();
  if (nome === "") return;

  const novaLinha = `
    <tr>
      <td>${id++}</td>
      <td>${nome}</td>
    </tr>
  `;

  tabela.insertAdjacentHTML('beforeend', novaLinha);

  document.querySelector("#navbar span").textContent = nome;
  document.title = nome;

  document.getElementById("formularioContainer").classList.add("d-none");
  document.getElementById("telaLinks").classList.remove("d-none");

  form.reset();
});