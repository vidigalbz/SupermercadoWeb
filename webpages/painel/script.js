// Dados do usuário
let username = document.getElementById('userName');
let userIdLabel = document.getElementById('userEnrollment');
const profileImageElem = document.getElementById('profileImage');
const fileInput = document.getElementById('fileInput');
const btnChangeImage = document.getElementById('btnChangeImage');
const btnRemoveImage = document.getElementById('btnRemoveImage');

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

function main() {
  loadUserData();

  // Quando clicar em "Alterar Imagem", abre o seletor de arquivos
  btnChangeImage.addEventListener("click", () => {
    fileInput.click();
  });

  // Quando o usuário selecionar um arquivo, envia ao backend
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);
    formData.append("userId", userId);

    try {
      const response = await fetch("/uploadProfileImage", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (data.status === "success") {
        const novaUrl = await getImageURL(data.profileImage);
        profileImageElem.src = novaUrl;
        fileInput.value = "";
      } else {
        console.error("Falha no upload:", data.message);
      }
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
    }
  });

  // Quando clicar em "Remover Imagem", chama rota de remoção
  btnRemoveImage.addEventListener("click", async () => {
    if (!confirm("Deseja realmente remover sua foto de perfil?")) return;

    try {
      const response = await fetch("/removeProfileImage", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.status === "success") {
        profileImageElem.src =
          "https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1";
      } else {
        console.error("Falha ao remover imagem:", data.message);
      }
    } catch (err) {
      console.error("Erro ao chamar /removeProfileImage:", err);
    }
  });
}

async function getImageURL(rawImagePath) {
  const response = await fetch('/api/ip');
  const data = await response.json();
  const ip = data.ip; // ex: “172.16.x.x”

  return rawImagePath
    ? `http://${ip}:4000/${rawImagePath}`
    : 'https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1';
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

async function loadUserData() {
  userId = getCookie("user");
  if (userId == "") {
     window.location.href = "http://localhost:4000/error403";
    return;
  } else {
    try {
      const response = await fetch('/users/' + userId);
      const data = await response.json();

      if (data.status === "success") {
        username.textContent = data.data.name;
        userIdLabel.textContent = userId;

        // Carregar foto de perfil
        const rawImagePath = data.data.profileImage;
        if (rawImagePath) {
          const urlImg = await getImageURL(rawImagePath);
          profileImageElem.src = urlImg;
        }
      } else {
        console.error("Error:", data.message);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
    }
  }
}

function confirmarSaida() {
  document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
  window.location.href = "/login";
}
