const API = 'http://localhost:4000'; // Esta variável API não parece estar sendo usada nos fetchs. Pode remover se não for usar.

const container = document.getElementById('container');
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');

// Alterna entre login e cadastro
if (signUpButton && signInButton && container) { // Adiciona verificação se os elementos existem
    signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
    signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
}


// Função para mostrar toast com mensagem e cor
function showToast(message, color = 'danger') {
  const toast = document.getElementById('liveToast');
  const toastMessage = document.getElementById('toastMessage');

  if (toast && toastMessage) { // Verifica se os elementos do toast existem
    toast.className = `toast align-items-center text-white bg-${color} border-0`;
    toastMessage.textContent = message;

    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast); // Usa getOrCreateInstance para segurança
    toastBootstrap.show();
  } else {
    console.warn("Elementos do Toast não encontrados no DOM. Mensagem:", message);
    // Fallback para alert se o toast não estiver disponível
    // alert(`${color.toUpperCase()}: ${message}`);
  }
}

// CADASTRO
const registerButton = document.getElementById("registerButton");
if (registerButton) {
    registerButton.addEventListener("click", function (e) {
    e.preventDefault();

    const nome = document.getElementById("nomeCadastro").value;
    const email = document.getElementById("emailCadastro").value;
    const senha = document.getElementById("senhaCadastro").value;
    const confirmar = document.getElementById("confirmedsenhaCadastro").value;

    if (!nome || !email || !senha || !confirmar) {
        showToast("Preencha todos os campos!", "warning");
        return;
    }

    if (senha !== confirmar) {
        showToast("As senhas não coincidem!", "danger");
        return;
    }
        
    fetch(`/cadastro`, { // Removido API daqui, pois não estava sendo usado e a rota é relativa
        method: "POST",
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: nome, email: email, password: senha })
    })
    .then(async res => { // Adicionado async para poder usar await res.json() no catch de erro de parsing
        if (!res.ok) {
            // Tenta pegar a mensagem de erro do backend se for um erro HTTP
            const errorData = await res.json().catch(() => ({ erro: "Erro desconhecido do servidor" }));
            throw new Error(errorData.erro || `Erro ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        // A rota /cadastro no express.js retorna { mensagem: "..." } ou { erro: "..." }
        // Não retorna data.status === "success" diretamente como a de login.
        if (data.mensagem && data.mensagem.includes("sucesso")) {
            showToast(data.mensagem, "success");
            if (container) container.classList.remove("right-panel-active"); // Volta para login
        } else if (data.erro){ // Verifica a propriedade 'erro'
            showToast(data.erro, "danger"); // Mostra o erro específico do backend
            // Não necessariamente volta para login aqui, depende do erro.
        } else {
            // Fallback para uma mensagem genérica se a estrutura da resposta não for a esperada
            showToast("Resposta inesperada do servidor.", "warning");
        }
    })
    .catch(error => {
        console.error("Erro no cadastro:", error);
        showToast(error.message || "Erro ao conectar com o servidor!", "danger")
    });
    });
}


// LOGIN
const loginButton = document.getElementById("loginButton");
if (loginButton) {
    loginButton.addEventListener("click", async function (e) {
    e.preventDefault();

    const email = document.getElementById("emailLogin").value;
    const senha = document.getElementById("senhaLogin").value;

    if (!email || !senha) {
        showToast("Preencha todos os campos!", "warning");
        return;
    }

    try {
        const response = await fetch(`/login`, { // Removido API daqui
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
        });

        const result = await response.json();

        if (result.status === "success") {
        showToast(`Bem-vindo, ${result.name || 'Usuário'}!`, "success");

        localStorage.setItem("userId", result.userId); // Salva o userId corretamente
        
        setTimeout(() => {
            // ***** CORREÇÃO APLICADA AQUI *****
            // Usar result.userId em vez de result.id
            window.location.href = `/supermercado/?userID=${result.userId}`;
        }, 1500);
        } else {
        showToast(result.message || "Email ou senha incorretos!", "danger");
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        showToast("Erro na conexão com o servidor.", "danger");
    }
    });
}

// Ativar painel de cadastro se URL tiver ?cadastro=1
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("cadastro") === "1") {
    const signUpButtonInit = document.getElementById("signUp"); // Renomeado para evitar conflito de escopo
    if (signUpButtonInit && container) { // Verifica container também
      container.classList.add("right-panel-active"); // Mostra painel de cadastro diretamente
    }
  }
});