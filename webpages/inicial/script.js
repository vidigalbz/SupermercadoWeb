function adicionarSupermercado() {
    document.getElementById("formularioContainer").classList.remove("d-none");
    document.getElementById("telaInicial").classList.add("d-none");
  }

  function voltar() {
    document.getElementById("formularioContainer").classList.add("d-none");
    document.getElementById("telaInicial").classList.remove("d-none");
  }