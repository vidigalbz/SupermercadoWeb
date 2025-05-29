const API = 'http://localhost:4000';

const container = document.getElementById('container');
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');

// Alterna entre login e cadastro
signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));

// Função para mostrar toast com mensagem e cor
function showToast(message, color = 'danger') {
  const toast = document.getElementById('liveToast');
  const toastMessage = document.getElementById('toastMessage');

  toast.className = `toast align-items-center text-white bg-${color} border-0`;
  toastMessage.textContent = message;

  const toastBootstrap = new bootstrap.Toast(toast);
  toastBootstrap.show();
}

// CADASTRO
document.getElementById("registerButton").addEventListener("click", function (e) {
  e.preventDefault();

  const nome = document.getElementById("nomeCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  const confirmar = document.getElementById("confirmedsenhaCadastro").value;
  const funcao = document.getElementById("funcaoToggle");

  if (!nome || !senha || !confirmar) {
    showToast("Preencha todos os campos!", "warning");
    return;
  }

  if (senha !== confirmar) {
    showToast("As senhas não coincidem!", "danger");
    return;
  }

  fetch(`/cadastro`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: nome, password: senha, gestor: funcao.checked})
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        showToast("Erro ao cadastrar", "danger");
        container.classList.remove("right-panel-active"); // Volta para login
      } else if (data.erro == "Usuário já cadastrado!") {
        showToast("Este usuário já esta cadastrado", "danger");
        container.classList.remove("right-panel-active");
      }
      else {
        // Exibir a mensagem de erro recebida do servidor
        showToast(data.message || "Cadastro realizado com sucesso!", "success");
        container.classList.remove("right-panel-active")
      }
    })
    .catch(() => showToast("Erro ao conectar com o servidor!", "danger"));
});

// LOGIN
document.getElementById("loginButton").addEventListener("click", async function (e) {
  e.preventDefault();

  const name = document.getElementById("nameLogin").value;
  const senha = document.getElementById("senhaLogin").value;

  if (!name || !senha) {
    showToast("Preencha todos os campos!", "warning");
    return;
  }

  try {
    const response = await fetch(`/login`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, senha })
    });

    const result = await response.json();

    if (result.status === "success") {
      showToast(`Bem-vindo, ${result.name || 'Usuário'}!`, "success");

      setTimeout(() => {
        window.location.href = `/supermercado/?userID=${result.id}`;
      }, 1500);
    } else {
      showToast(result.message || "Usuário ou senha incorretos!", "danger");
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    showToast("Erro na conexão com o servidor.", "danger");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("cadastro") === "1") {
    const signUpButton = document.getElementById("signUp");
    if (signUpButton) {
      signUpButton.click();
    }
  }
});