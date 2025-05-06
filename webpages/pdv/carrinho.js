function mostrarNotificacao(mensagem, tipo = 'info') {
  const toastEl = document.getElementById('liveToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  
  // Configura cores e ícones baseados no tipo
  const tipos = {
    success: { 
      bg: 'bg-success text-white', 
      icon: '✔️',
      title: 'Sucesso'
    },
    error: { 
      bg: 'bg-danger text-white', 
      icon: '❌',
      title: 'Erro'
    },
    warning: { 
      bg: 'bg-warning text-dark', 
      icon: '⚠️',
      title: 'Aviso'
    },
    info: { 
      bg: 'bg-info text-dark', 
      icon: 'ℹ️',
      title: 'Informação'
    }
  };
  
  const config = tipos[tipo] || tipos.info;
  
  // Atualiza o toast
  toastTitle.innerHTML = `${config.icon} ${config.title}`;
  toastMessage.textContent = mensagem;
  
  // Remove classes anteriores e adiciona as novas
  toastEl.className = `toast align-items-center text-white ${config.bg} border-0`;
  
  // Mostra o toast
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
  
  // Esconde automaticamente após 5 segundos
  setTimeout(() => toast.hide(), 5000);
}

function adicionarProduto() {
  const input = document.getElementById("codigoProdutoInput");
  const codigo = input.value.trim();
  
  if (!codigo) {
    mostrarNotificacao("Por favor, digite o código do produto!", "warning");
    input.focus();
    return;
  }
  mostrarNotificacao(`Produto com código '${codigo}' adicionado ao carrinho!`, "success");
  
  input.value = "";
  input.focus();
}

document.addEventListener('DOMContentLoaded', function() {
  const toastEl = document.getElementById('liveToast');
  new bootstrap.Toast(toastEl);
});