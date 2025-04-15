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
    
  fetch(`/cadastro`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: nome, email: email, password: senha })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      showToast("Cadastro realizado com sucesso!", "success");
      container.classList.remove("right-panel-active"); // Volta para login
    } else {
      showToast(data.message || "Erro ao cadastrar.", "danger");
    }
  })
  .catch(() => showToast("Erro ao conectar com o servidor!", "danger"));
});

// LOGIN
document.getElementById("loginButton").addEventListener("click", async function (e) {
  e.preventDefault();

  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;

  if (!email || !senha) {
    showToast("Preencha todos os campos!", "warning");
    return;
  }

  try {
    const response = await fetch(`${API}/login`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const result = await response.json();

    if (result.status === "success") {
      localStorage.setItem("user", JSON.stringify({
        name: result.name,
        email: result.email,
        userId: result.userId
      }));
    
      alert(`Bem-vindo, ${result.name}!`);
      window.location.href = '/supermercado';
    } else {
      showToast(result.message || "Email ou senha incorretos!", "danger");
    }    
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    showToast("Erro na conexão com o servidor.", "danger");
  }
});
