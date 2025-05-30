// Dados do usuário
let username = document.getElementById('userName');
let userIdLabel = document.getElementById('userEnrollment');

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

let userId;

const permissoesPorLoja = {
    "Loja Centro": {
        estoque: true,
        caixa: true,
        relatorios: true,
        rastreio: false,
        configuracoes: false
    },
    "Loja Norte": {
        estoque: true,
        caixa: false,
        relatorios: false,
        rastreio: false,
        configuracoes: false
    }
};

main();

function main(){
    loadUserData();
}

function selecionarSupermercado(nomeLoja) {
    document.getElementById('nomeLojaSelecionada').textContent = nomeLoja;
    document.getElementById('supermercadoSelect').classList.add('d-none');
    document.getElementById('acessosPanel').classList.remove('d-none');
    atualizarAcessos(permissoesPorLoja[nomeLoja]);
}

function voltarParaSupermercados() {
    document.getElementById('supermercadoSelect').classList.remove('d-none');
    document.getElementById('acessosPanel').classList.add('d-none');
}

function atualizarAcessos(permissoes) {
    toggleCard('cardEstoque', permissoes.estoque);
    toggleCard('cardCaixa', permissoes.caixa);
    toggleCard('cardRelatorios', permissoes.relatorios);
    toggleCard('cardRastreio', permissoes.rastreio);
    toggleCard('cardConfiguracoes', permissoes.configuracoes);
}

function toggleCard(id, habilitado) {
    const card = document.getElementById(id);
    if (habilitado) {
        card.classList.remove('disabled-card');
    } else {
        card.classList.add('disabled-card');
    }
}

function loadUserData() {
    userId = getCookie("user");
    console.log("User: " + userId   )
    console.log("startup");
    if (userId == "")
   //     window.location.href = "http://localhost:4000/error404";
        return
    else {
        fetch('/users/' + userId)
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    username.textContent = data.data.name;
                    userIdLabel.textContent = userId;
                } else {
                    console.error("Error:", data.message);
                }
            })
            .catch(error => {
                console.error("Fetch failed:", error);
            });
    }
}

function confirmarSaida(){
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    window.location.href = "/login";
}