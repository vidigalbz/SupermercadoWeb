
const copiarpvd = document.getElementById('copiarpvd');
const textoParaCopiarpvd = document.getElementById('textoParaCopiar');
const mensagempvd = document.getElementById('mensagem');

copiarpvd.addEventListener('click', () => {
    const texto = textoParaCopiarpvd.textContent;
    const originalHTML = copiarpvd.innerHTML;
    
    navigator.clipboard.writeText(texto)
        .then(() => {
            copiarpvd.innerHTML = '<span class="check-verde">✓</span>';
            setTimeout(() => {
                copiarpvd.innerHTML = originalHTML;
            }, 3000);
        })
        .catch(err => {
            console.error('Erro ao copiar: ', err);
            // Fallback... (o mesmo código de cima)
        });
});

const copiarestoque = document.getElementById('copiarestoque');
const textoParaCopiarestoque = document.getElementById('textoParaCopiar');
const mensagemestoque = document.getElementById('mensagem');

copiarestoque.addEventListener('click', () => {
    const texto = textoParaCopiarestoque.textContent;
    const originalHTML = copiarestoque.innerHTML;
    
    navigator.clipboard.writeText(texto)
        .then(() => {
            copiarestoque.innerHTML = '<span class="check-verde">✓</span>';
            setTimeout(() => {
                copiarestoque.innerHTML = originalHTML;
            }, 3000);
        })
        .catch(err => {
            console.error('Erro ao copiar: ', err);
            // Fallback... (o mesmo código de cima)
        });
});
