document.getElementById("meuBotao").addEventListener("click", function() {
    document.getElementById("mensagem").innerText = "Você clicou no botão!";
});

document.getElementById("saudacaoBotao").addEventListener("click", function() {
    let nome = document.getElementById("nome").value;
    if (nome) {
        document.getElementById("saudacao").innerText = `Olá, ${nome}! Bem-vindo!`;
    } else {
        document.getElementById("saudacao").innerText = "Por favor, digite seu nome.";
    }
});
