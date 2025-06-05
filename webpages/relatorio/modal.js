const modalEl = document.getElementById('loadingModal');
modalEl.addEventListener('shown.bs.modal', () => {
    document.getElementById('spinnerSection').classList.remove('d-none');
    document.getElementById('okSection').classList.add('d-none');

    // Simula carregamento de 3 segundos
    setTimeout(() => {
        document.getElementById('spinnerSection').classList.add('d-none');
        document.getElementById('okSection').classList.remove('d-none');
    }, 3000);
});