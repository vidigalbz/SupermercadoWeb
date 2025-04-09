const API = 'http://localhost:3000';

const container = document.getElementById('container');
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');

signUpButton.addEventListener('click', () => {
  container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
  container.classList.remove("right-panel-active");
});

document.getElementById("registerButton").addEventListener("click", function (e) {
  e.preventDefault();
      
  const nome = document.getElementById("nomeCadastro").value;
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  const confirmar = document.getElementById("confirmedsenhaCadastro").value;
    
  if (senha !== confirmar) {
    alert("As senhas não coincidem.");
    return;
  }
    
  fetch(`${API}/register`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nome, email, senha })
  })
  .then(res => res.json())
  .then(data => {
  if (data.status === "success") {
    alert("Cadastro realizado com sucesso!");
  } else {
      alert(data.message);
    }
  });
});
    
document.getElementById("loginButton").addEventListener("click", async function (e) {
  e.preventDefault();

  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;

  try {
    const response = await fetch(`${API}/login`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });

    const result = await response.json();

    if (result.status === "success") {
      alert(`Bem-vindo, ${result.nome}!`);
      window.location.href = '/inicial/index.html';
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    alert("Erro na conexão com o servidor.");
  }
});
