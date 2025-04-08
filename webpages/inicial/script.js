function adicionarSupermercado() {
    document.getElementById("formularioContainer").classList.remove("d-none");
    document.getElementById("telaInicial").classList.add("d-none");
  }

  function voltar() {
    document.getElementById("formularioContainer").classList.add("d-none");
    document.getElementById("telaInicial").classList.remove("d-none");
  }

  function copiarLink(idInput) {
    const input = document.getElementById(idInput);
    input.select();
    input.setSelectionRange(0, 99999); // Para mobile
    document.execCommand("copy");
  
    // Alerta temporário (opcional)
    alert("Link copiado!");
  }
  

  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const nomeInput = document.getElementById("nomeSupermercado");
    const nome = nomeInput.value.trim();
    const errorMsg = document.getElementById("error-message");
  
    if (nome === "") {
      errorMsg.textContent = "Por favor, digite um nome válido.";
    } else {
      // Atualiza a navbar com o nome do supermercado
      document.querySelector("#navbar span").textContent = nome;
      document.querySelector("title").textContent = nome;
  
      // Oculta o formulário e exibe os links
      document.getElementById("formularioContainer").classList.add("d-none");
      document.getElementById("telaLinks").classList.remove("d-none");
  
      // Limpa erros e o campo
      errorMsg.textContent = "";
      nomeInput.value = "";
    }
  });
  