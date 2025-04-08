function abrirPopupAdicionarProduto() {
    document.getElementById("popup-adicionar-produto").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  }
  
  function abrirPopupAdicionarSetor() {
    document.getElementById("popup-adicionar-setor").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  }
  
  function fecharPopup() {
    document.getElementById("popup-adicionar-produto").style.display = "none";
    document.getElementById("popup-adicionar-setor").style.display = "none";
    document.getElementById("overlay").style.display = "none";
  }
  