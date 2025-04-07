// Função para mostrar o formulário
function adicionarSupermercado() {
    document.getElementById("formularioContainer").style.display = "flex";
    document.getElementById("telaInicial").style.display = "none";
}

// Função para voltar à tela inicial
function voltar() {
    document.getElementById("formularioContainer").style.display = "none";
    document.getElementById("telaInicial").style.display = "flex";
}