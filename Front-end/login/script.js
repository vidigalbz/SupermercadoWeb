document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let errorMessage = document.getElementById('error-message');

    try {
        let response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        let data = await response.json();
        if (response.ok) {
            alert("Login bem-sucedido!");
            window.location.href = "../inicial/index.html";
        } else {
            errorMessage.textContent = data.message;
        }
    } catch (error) {
        errorMessage.textContent = "Erro ao conectar ao servidor.";
    }
});

document.getElementById('cadastrar').addEventListener('click', function (event) {
    event.preventDefault();
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.register-container').style.display = 'flex';
});

document.getElementById('irParaLogin').addEventListener('click', function (event) {
    event.preventDefault();
    document.querySelector('.register-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'flex';
});
