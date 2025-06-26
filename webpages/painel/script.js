// Dados do usuário
let username = document.getElementById('userName');
let userCode = document.getElementById('userCode');
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
      const response = await fetch("/api/profileImages/uploadProfileImage", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (data.status === "success") {
        const novaUrl = await getImageURL(data.profileImage);
        profileImageElem.src = novaUrl;
        fileInput.value = "";
      } else {
        //console.error("Falha no upload:", data.message);
      }
    } catch (err) {
      //console.error("Erro ao fazer upload:", err);
    }
  });

  // Quando clicar em "Remover Imagem", chama rota de remoção
  btnRemoveImage.addEventListener("click", async () => {
    if (!confirm("Deseja realmente remover sua foto de perfil?")) return;

    try {
      const response = await fetch("/api/profileImages/removeProfileImage", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.status === "success") {
        profileImageElem.src =
          "https://i0.wp.com/espaferro.com.br/wp-content/uploads/2024/06/placeholder.png?ssl=1";
      } else {
        //console.error("Falha ao remover imagem:", data.message);
      }
    } catch (err) {
      //console.error("Erro ao chamar /removeProfileImage:", err);
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

function selecionarSupermercado(perimissions, name) {
  document.getElementById('nomeLojaSelecionada').textContent = "acessos para " + name;
  document.getElementById('supermercadoSelect').classList.add('d-none');
  document.getElementById('acessosPanel').classList.remove('d-none');
  atualizarAcessos(perimissions);
}

function voltarParaSupermercados() {
  document.getElementById('supermercadoSelect').classList.remove('d-none');
  document.getElementById('acessosPanel').classList.add('d-none');
}

function atualizarAcessos(encodedPermissions) {
  const decoded = decodeURIComponent(encodedPermissions);
  const permissoes = JSON.parse(decoded);
  toggleCard('cardEstoque', permissoes.estoque);
  toggleCard('cardCaixa', permissoes.caixa);
  toggleCard('cardRelatorios', permissoes.relatorios);
  toggleCard('cardRastreio', permissoes.rastreio);
  toggleCard('cardFornecedores', permissoes.fornecedor);
}

function toggleCard(id, habilitado) {
  const card = document.getElementById(id);
  card.classList.toggle('disabled-card', Number(habilitado) !== 1);
}

function addMarketCard(marketIcon, marketName, permissions) {
  const marketList = document.getElementById('supermercadosList');
  const encodedPermissions = encodeURIComponent(JSON.stringify(permissions));
  const innerHTML = `
    <div class="col">
      <a href="#" class="card text-center access-card" onclick="selecionarSupermercado('${encodedPermissions}','${marketName}')">
        <div class="card-body">
          <div style="font-size: 2.5rem;">${marketIcon}</div>
          <h6 class="mt-2">${marketName}</h6>
        </div>
      </a>
    </div>`;
  marketList.innerHTML += innerHTML;
}

function irParaTela(tela) {
  window.location.href = `${window.location.origin}/${tela}`
}

async function loadMarketData(userId) {
  const response = await fetch(`/api/usuarios/user_permissions/${userId}`);
  const json = await response.json();

  for (const permission of json.data) {
    // Agora que 'permission' está definido, podemos usar permission.marketId
    const marketResponse = await fetch("/api/supermercados/pegarSupermercadoNome", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ busca: permission.marketId })
    });
    
    const marketData = await marketResponse.json();
    const marketName = marketData.mensagem[0].name;
    const marketIcon = marketData.mensagem[0].icon;

    const permissions = {
      pdv: permission.pdv,
      estoque: permission.estoque,
      fornecedor: permission.fornecedor,
      relatorios: permission.relatorios,
      alertas: permission.alertas,
      rastreamento: permission.rastreamento
    };

    addMarketCard(marketIcon, marketName, permissions);
  }
}

async function loadUserData() {
  userId = getCookie("user");
  if (userId == "") {
    const response = await fetch('/api/ip');
    const data = await response.json();
    const ip = data.ip;
    window.location.href = `http://${ip}:4000/error403`;
    return;
  } else {
    try {
      const response = await fetch(`/api/usuarios/users/${userId}`);
      const data = await response.json();

      if (data.status === "success") {
        username.textContent = data.data.name;
        userCode.textContent = userId;

        // Carregar foto de perfil
        const rawImagePath = data.data.profileImage;
        if (rawImagePath) {
          const urlImg = await getImageURL(rawImagePath);
          profileImageElem.src = urlImg;
        }

        await loadMarketData(userId);
      } else {
        return;
      }
    } catch (error) {
      return;
    }
  }
}

function confirmarSaida() {
  document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
  window.location.href = "/login";
}
