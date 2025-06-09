let graficoAtualFinanceiro = null;
let graficoAtualABC = null;

let dadosFinanceirosPorMes = [
    { mes: 'Janeiro 2024', receita: 30000, despesa: 10000, lucro: 20000 },
    { mes: 'Fevereiro 2024', receita: 20000, despesa: 15000, lucro: 5000 },
    { mes: 'Março 2024', receita: 38000, despesa: 16000, lucro: 22000 },
    { mes: 'Abril 2024', receita: 50000, despesa: 32000, lucro: 18000 },
    { mes: 'Maio 2024', receita: 52000, despesa: 33000, lucro: 19000 },
    { mes: 'Junho 2024', receita: 50000, despesa: 33000, lucro: 17000 },
    { mes: 'Julho 2024', receita: 50000, despesa: 32000, lucro: 18000 },
    { mes: 'Agosto 2024', receita: 40000, despesa: 12000, lucro: 28000 },
    { mes: 'Setembro 2024', receita: 35000, despesa: 40000, lucro: 1000 },
    { mes: 'Outubro 2024', receita: 32000, despesa: 45000, lucro: 1000 },
    { mes: 'Novembro 2024', receita: 25000, despesa: 10000, lucro: 15000 },
    { mes: 'Dezembro 2024', receita: 46000, despesa: 40000, lucro: 6000 },
    { mes: 'Janeiro 2025', receita: 48000, despesa: 35000, lucro: 13000 },
    { mes: 'Fevereiro 2025', receita: 50000, despesa: 30000, lucro: 20000 },
    { mes: 'Março 2025', receita: 60000, despesa: 40000, lucro: 20000 },
    { mes: 'Abril 2025', receita: 70000, despesa: 50000, lucro: 20000 },
    { mes: 'Maio 2025', receita: 80000, despesa: 60000, lucro: 20000 }
];

let vendasPorClasse = [
    { mes: "Janeiro 2024", labels: ["Classe A (40%)", "Classe B (35%)", "Classe C (25%)"], dados: [40, 35, 25], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Fevereiro 2024", labels: ["Classe A (45%)", "Classe B (30%)", "Classe C (25%)"], dados: [45, 30, 25], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Março 2024", labels: ["Classe A (50%)", "Classe B (25%)", "Classe C (25%)"], dados: [50, 25, 25], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Abril 2024", labels: ["Classe A (55%)", "Classe B (20%)", "Classe C (25%)"], dados: [55, 20, 25], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Maio 2024", labels: ["Classe A (60%)", "Classe B (25%)", "Classe C (15%)"], dados: [60, 25, 15], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Junho 2024", labels: ["Classe A (42%)", "Classe B (33%)", "Classe C (25%)"], dados: [42, 33, 25], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Julho 2024", labels: ["Classe A (48%)", "Classe B (32%)", "Classe C (20%)"], dados: [48, 32, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Agosto 2024", labels: ["Classe A (52%)", "Classe B (28%)", "Classe C (20%)"], dados: [52, 28, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Setembro 2024", labels: ["Classe A (50%)", "Classe B (30%)", "Classe C (20%)"], dados: [50, 30, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Outubro 2024", labels: ["Classe A (46%)", "Classe B (34%)", "Classe C (20%)"], dados: [46, 34, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Novembro 2024", labels: ["Classe A (49%)", "Classe B (31%)", "Classe C (20%)"], dados: [49, 31, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Dezembro 2024", labels: ["Classe A (53%)", "Classe B (27%)", "Classe C (20%)"], dados: [53, 27, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Janeiro 2025", labels: ["Classe A (50%)", "Classe B (30%)", "Classe C (20%)"], dados: [50, 30, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Fevereiro 2025", labels: ["Classe A (47%)", "Classe B (33%)", "Classe C (20%)"], dados: [47, 33, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Março 2025", labels: ["Classe A (44%)", "Classe B (36%)", "Classe C (20%)"], dados: [44, 36, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Abril 2025", labels: ["Classe A (51%)", "Classe B (29%)", "Classe C (20%)"], dados: [51, 29, 20], cores: ["#198754", "#ffc107", "#dc3545"] },
    { mes: "Maio 2025", labels: ["Classe A (50%)", "Classe B (25%)", "Classe C (25%)"], dados: [50, 25, 25], cores: ["#198754", "#ffc107", "#dc3545"] }
];

let produtosEncalhados = [
    {
        mes: "Janeiro 2024", produtos: [
            { nome: 'Detergente', validade: '30 dias', estoque: 45, codigo: '2', lote: 'EEEE', ultimaVenda: '05/01/2024' },
            { nome: 'Sabão em Pó', validade: '15 dias', estoque: 20, codigo: '5', lote: 'A1B2', ultimaVenda: '03/01/2024' },
            { nome: 'Água Sanitária', validade: '60 dias', estoque: 35, codigo: '9', lote: 'XYZ9', ultimaVenda: '01/01/2024' },
            { nome: 'Esponja de Aço', validade: '90 dias', estoque: 10, codigo: '12', lote: 'SDF4', ultimaVenda: '02/01/2024' },
            { nome: 'Amaciante', validade: '25 dias', estoque: 50, codigo: '18', lote: 'AMCT', ultimaVenda: '08/01/2024' }
        ]
    },
    {
        mes: "Fevereiro 2024", produtos: [
            { nome: 'Detergente1', validade: '25 dias', estoque: 42, codigo: '2', lote: 'EEEE', ultimaVenda: '10/01/2024' },
            { nome: 'Sabão em Pó', validade: '10 dias', estoque: 18, codigo: '5', lote: 'A1B2', ultimaVenda: '08/01/2024' },
            { nome: 'Água Sanitária', validade: '55 dias', estoque: 32, codigo: '9', lote: 'XYZ9', ultimaVenda: '02/01/2024' },
            { nome: 'Esponja de Aço', validade: '80 dias', estoque: 8, codigo: '12', lote: 'SDF4', ultimaVenda: '05/01/2024' },
            { nome: 'Amaciante', validade: '20 dias', estoque: 45, codigo: '18', lote: 'AMCT', ultimaVenda: '12/01/2024' }
        ]
    },
    {
        mes: "Março 2024", produtos: [
            { nome: 'Detergente2', validade: '20 dias', estoque: 40, codigo: '2', lote: 'EEEE', ultimaVenda: '15/02/2024' },
            { nome: 'Sabão em Pó', validade: '5 dias', estoque: 16, codigo: '5', lote: 'A1B2', ultimaVenda: '10/02/2024' },
            { nome: 'Água Sanitária', validade: '50 dias', estoque: 28, codigo: '9', lote: 'XYZ9', ultimaVenda: '01/02/2024' },
            { nome: 'Esponja de Aço', validade: '70 dias', estoque: 7, codigo: '12', lote: 'SDF4', ultimaVenda: '03/02/2024' },
            { nome: 'Amaciante', validade: '18 dias', estoque: 43, codigo: '18', lote: 'AMCT', ultimaVenda: '14/02/2024' }
        ]
    },
    {
        mes: "Abril 2024", produtos: [
            { nome: 'Detergente3', validade: '15 dias', estoque: 38, codigo: '2', lote: 'EEEE', ultimaVenda: '20/03/2024' },
            { nome: 'Sabão em Pó', validade: '2 dias', estoque: 14, codigo: '5', lote: 'A1B2', ultimaVenda: '15/03/2024' },
            { nome: 'Água Sanitária', validade: '45 dias', estoque: 25, codigo: '9', lote: 'XYZ9', ultimaVenda: '05/03/2024' },
            { nome: 'Esponja de Aço', validade: '60 dias', estoque: 6, codigo: '12', lote: 'SDF4', ultimaVenda: '10/03/2024' },
            { nome: 'Amaciante', validade: '15 dias', estoque: 40, codigo: '18', lote: 'AMCT', ultimaVenda: '18/03/2024' }
        ]
    },
    {
        mes: "Maio 2024", produtos: [
            { nome: 'Detergente4', validade: '10 dias', estoque: 35, codigo: '2', lote: 'EEEE', ultimaVenda: '25/04/2024' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 12, codigo: '5', lote: 'A1B2', ultimaVenda: '20/04/2024' },
            { nome: 'Água Sanitária', validade: '40 dias', estoque: 22, codigo: '9', lote: 'XYZ9', ultimaVenda: '10/04/2024' },
            { nome: 'Esponja de Aço', validade: '50 dias', estoque: 5, codigo: '12', lote: 'SDF4', ultimaVenda: '15/04/2024' },
            { nome: 'Amaciante', validade: '12 dias', estoque: 38, codigo: '18', lote: 'AMCT', ultimaVenda: '22/04/2024' }
        ]
    },
    {
        mes: "Junho 2024", produtos: [
            { nome: 'Detergente5', validade: '5 dias', estoque: 32, codigo: '2', lote: 'EEEE', ultimaVenda: '30/05/2024' },
            { nome: 'Sabão em Pó', validade: '0 dias', estoque: 10, codigo: '5', lote: 'A1B2', ultimaVenda: '25/05/2024' },
            { nome: 'Água Sanitária', validade: '35 dias', estoque: 20, codigo: '9', lote: 'XYZ9', ultimaVenda: '15/05/2024' },
            { nome: 'Esponja de Aço', validade: '40 dias', estoque: 4, codigo: '12', lote: 'SDF4', ultimaVenda: '20/05/2024' },
            { nome: 'Amaciante', validade: '8 dias', estoque: 35, codigo: '18', lote: 'AMCT', ultimaVenda: '28/05/2024' }
        ]
    },
    {
        mes: "Julho 2024", produtos: [
            { nome: 'Detergente6', validade: '2 dias', estoque: 30, codigo: '2', lote: 'EEEE', ultimaVenda: '05/07/2024' },
            { nome: 'Sabão em Pó', validade: '0 dias', estoque: 8, codigo: '5', lote: 'A1B2', ultimaVenda: '30/06/2024' },
            { nome: 'Água Sanitária', validade: '30 dias', estoque: 18, codigo: '9', lote: 'XYZ9', ultimaVenda: '20/06/2024' },
            { nome: 'Esponja de Aço', validade: '30 dias', estoque: 3, codigo: '12', lote: 'SDF4', ultimaVenda: '25/06/2024' },
            { nome: 'Amaciante', validade: '5 dias', estoque: 32, codigo: '18', lote: 'AMCT', ultimaVenda: '03/07/2024' }
        ]
    },
    {
        mes: "Agosto 2024", produtos: [
            { nome: 'Detergente7', validade: '0 dias', estoque: 28, codigo: '2', lote: 'EEEE', ultimaVenda: '10/08/2024' },
            { nome: 'Sabão em Pó', validade: '0 dias', estoque: 6, codigo: '5', lote: 'A1B2', ultimaVenda: '05/08/2024' },
            { nome: 'Água Sanitária', validade: '25 dias', estoque: 16, codigo: '9', lote: 'XYZ9', ultimaVenda: '25/07/2024' },
            { nome: 'Esponja de Aço', validade: '20 dias', estoque: 2, codigo: '12', lote: 'SDF4', ultimaVenda: '30/07/2024' },
            { nome: 'Amaciante', validade: '2 dias', estoque: 30, codigo: '18', lote: 'AMCT', ultimaVenda: '08/08/2024' }
        ]
    },
    {
        mes: "Setembro 2024", produtos: [
            { nome: 'Detergente8', validade: '0 dias', estoque: 25, codigo: '2', lote: 'EEEE', ultimaVenda: '15/09/2024' },
            { nome: 'Sabão em Pó', validade: '0 dias', estoque: 4, codigo: '5', lote: 'A1B2', ultimaVenda: '10/09/2024' },
            { nome: 'Água Sanitária', validade: '20 dias', estoque: 14, codigo: '9', lote: 'XYZ9', ultimaVenda: '30/08/2024' },
            { nome: 'Esponja de Aço', validade: '15 dias', estoque: 1, codigo: '12', lote: 'SDF4', ultimaVenda: '05/09/2024' },
            { nome: 'Amaciante', validade: '0 dias', estoque: 28, codigo: '18', lote: 'AMCT', ultimaVenda: '13/09/2024' }
        ]
    },
    {
        mes: "Outubro 2024", produtos: [
            { nome: 'Detergente9', validade: '0 dias ', estoque: 22, codigo: '2', lote: 'EEEE', ultimaVenda: '20/10/2024' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 2, codigo: '5', lote: 'A1B2', ultimaVenda: '15/10/2024' },
            { nome: 'Água Sanitária', validade: '15 dias', estoque: 12, codigo: '9', lote: 'XYZ9', ultimaVenda: '05/10/2024' },
            { nome: 'Esponja de Aço', validade: '10 dias', estoque: 0, codigo: '12', lote: 'SDF4', ultimaVenda: '10/10/2024' },
            { nome: 'Amaciante', validade: '0 dias ', estoque: 25, codigo: '18', lote: 'AMCT', ultimaVenda: '18/10/2024' }
        ]
    },
    {
        mes: "Novembro 2024", produtos: [
            { nome: 'Detergente10', validade: '0 dias ', estoque: 20, codigo: '2', lote: 'EEEE', ultimaVenda: '25/11/2024' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 0, codigo: '5', lote: 'A1B2', ultimaVenda: '20/11/2024' },
            { nome: 'Água Sanitária', validade: '10 dias', estoque: 10, codigo: '9', lote: 'XYZ9', ultimaVenda: '10/11/2024' },
            { nome: 'Esponja de Aço', validade: '5 dias', estoque: 0, codigo: '12', lote: 'SDF4', ultimaVenda: '15/11/2024' },
            { nome: 'Amaciante', validade: '0 dias ', estoque: 22, codigo: '18', lote: 'AMCT', ultimaVenda: '23/11/2024' }
        ]
    },
    {
        mes: "Dezembro 2024", produtos: [
            { nome: 'Detergente11', validade: '0 dias ', estoque: 18, codigo: '2', lote: 'EEEE', ultimaVenda: '30/12/2024' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 0, codigo: '5', lote: 'A1B2', ultimaVenda: '25/12/2024' },
            { nome: 'Água Sanitária', validade: '5 dias', estoque: 8, codigo: '9', lote: 'XYZ9', ultimaVenda: '15/12/2024' },
            { nome: 'Esponja de Aço', validade: '0 dias ', estoque: 0, codigo: '12', lote: 'SDF4', ultimaVenda: '20/12/2024' },
            { nome: 'Amaciante', validade: '0 dias ', estoque: 20, codigo: '18', lote: 'AMCT', ultimaVenda: '28/12/2024' }
        ]
    },
    {
        mes: "Janeiro 2025", produtos: [
            { nome: 'Detergente12', validade: '0 dias ', estoque: 15, codigo: '2', lote: 'EEEE', ultimaVenda: '05/01/2025' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 0, codigo: '5', lote: 'A1B2', ultimaVenda: '30/12/2024' },
            { nome: 'Água Sanitária', validade: '2 dias', estoque: 6, codigo: '9', lote: 'XYZ9', ultimaVenda: '20/01/2025' },
            { nome: 'Esponja de Aço', validade: '0 dias ', estoque: 0, codigo: '12', lote: 'SDF4', ultimaVenda: '25/01/2025' },
            { nome: 'Amaciante', validade: '0 dias ', estoque: 18, codigo: '18', lote: 'AMCT', ultimaVenda: '03/01/2025' }
        ]
    },
    {
        mes: "Fevereiro 2025", produtos: [
            { nome: 'Detergente13', validade: '0 dias ', estoque: 12, codigo: '2', lote: 'EEEE', ultimaVenda: '10/02/2025' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 0, codigo: '5', lote: 'A1B2', ultimaVenda: '05/02/2025' },
            { nome: 'Água Sanitária', validade: '0 dias ', estoque: 4, codigo: '9', lote: 'XYZ9', ultimaVenda: '25/01/2025' },
            { nome: 'Esponja de Aço', validade: '0 dias ', estoque: 0, codigo: '12', lote: 'SDF4', ultimaVenda: '30/01/2025' },
            { nome: 'Amaciante', validade: '0 dias ', estoque: 15, codigo: '18', lote: 'AMCT', ultimaVenda: '08/02/2025' }
        ]
    },
    {
        mes: "Março 2025", produtos: [
            { nome: 'Detergente14', validade: '0 dias ', estoque: 10, codigo: '2', lote: 'EEEE', ultimaVenda: '15/03/2025' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 0, codigo: '5', lote: 'A1B2', ultimaVenda: '10/03/2025' },
            { nome: 'Água Sanitária', validade: '0 dias ', estoque: 2, codigo: '9', lote: 'XYZ9', ultimaVenda: '05/03/2025' },
            { nome: 'Esponja de Aço', validade: '0 dias ', estoque: 0, codigo: '12', lote: 'SDF4', ultimaVenda: '10/03/2025' },
            { nome: 'Amaciante', validade: '0 dias ', estoque: 12, codigo: '18', lote: 'AMCT', ultimaVenda: '13/03/2025' }
        ]
    },
    {
        mes: "Abril 2025", produtos: [
            { nome: 'Detergente15', validade: '0 dias ', estoque: 8, codigo: '2', lote: 'EEEE', ultimaVenda: '20/04/2025' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 0, codigo: '5', lote: 'A1B2', ultimaVenda: '15/04/2025' },
            { nome: 'Água Sanitária', validade: '0 dias ', estoque: 0, codigo: '9', lote: 'XYZ9', ultimaVenda: '10/04/2025' },
            { nome: 'Esponja de Aço', validade: '0 dias ', estoque: 0, codigo: '12', lote: 'SDF4', ultimaVenda: '15/04/2025' },
            { nome: 'Amaciante', validade: '0 dias ', estoque: 10, codigo: '18', lote: 'AMCT', ultimaVenda: '18/04/2025' }
        ]
    },
    {
        mes: "Maio 2025", produtos: [
            { nome: 'Detergente16', validade: '0 dias ', estoque: 5, codigo: '2', lote: 'EEEE', ultimaVenda: '25/05/2025' },
            { nome: 'Sabão em Pó', validade: '0 dias ', estoque: 0, codigo: '5', lote: 'A1B2', ultimaVenda: '20/05/2025' },
            { nome: 'Água Sanitária', validade: '0 dias ', estoque: 0, codigo: '9', lote: 'XYZ9', ultimaVenda: '15/05/2025' },
            { nome: 'Esponja de Aço', validade: '0 dias ', estoque: 0, codigo: '12', lote: 'SDF4', ultimaVenda: '20/05/2025' },
            { nome: 'Amaciante', validade: '0 dias ', estoque: 8, codigo: '18', lote: 'AMCT', ultimaVenda: '23/05/2025' }
        ]
    }
];

let mesAtualIndex = dadosFinanceirosPorMes.length - 2;

let vendasPorMes = [
    {
        mes: "Abril 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 310, precoTotal: 930.0 },
            { nome: "Feijão", qtd: 270, precoTotal: 810.0 },
            { nome: "Macarrão", qtd: 205, precoTotal: 615.0 },
            { nome: "Sabão", qtd: 185, precoTotal: 555.0 },
            { nome: "Óleo", qtd: 155, precoTotal: 465.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 5, precoTotal: 15.0 },
            { nome: "Curry", qtd: 7, precoTotal: 21.0 },
            { nome: "Açafrão", qtd: 8, precoTotal: 24.0 },
            { nome: "Picles", qtd: 10, precoTotal: 30.0 },
            { nome: "Alcaparra", qtd: 12, precoTotal: 36.0 }
        ]
    },
    {
        mes: "Maio 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 325, precoTotal: 975.0 },
            { nome: "Feijão", qtd: 290, precoTotal: 870.0 },
            { nome: "Macarrão", qtd: 220, precoTotal: 660.0 },
            { nome: "Sabão", qtd: 190, precoTotal: 570.0 },
            { nome: "Óleo", qtd: 180, precoTotal: 540.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 3, precoTotal: 9.0 },
            { nome: "Curry", qtd: 5, precoTotal: 15.0 },
            { nome: "Açafrão", qtd: 7, precoTotal: 21.0 },
            { nome: "Picles", qtd: 9, precoTotal: 27.0 },
            { nome: "Alcaparra", qtd: 11, precoTotal: 33.0 }
        ]
    },
    {
        mes: "Abril 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 310, precoTotal: 930.0 },
            { nome: "Feijão", qtd: 265, precoTotal: 795.0 },
            { nome: "Macarrão", qtd: 195, precoTotal: 585.0 },
            { nome: "Sabão", qtd: 160, precoTotal: 480.0 },
            { nome: "Óleo", qtd: 150, precoTotal: 450.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 6, precoTotal: 18.0 },
            { nome: "Curry", qtd: 8, precoTotal: 24.0 },
            { nome: "Açafrão", qtd: 9, precoTotal: 27.0 },
            { nome: "Picles", qtd: 11, precoTotal: 33.0 },
            { nome: "Alcaparra", qtd: 13, precoTotal: 39.0 }
        ]
    },
    {
        mes: "Maio 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 315, precoTotal: 945.0 },
            { nome: "Feijão", qtd: 270, precoTotal: 810.0 },
            { nome: "Macarrão", qtd: 205, precoTotal: 615.0 },
            { nome: "Sabão", qtd: 170, precoTotal: 510.0 },
            { nome: "Óleo", qtd: 155, precoTotal: 465.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 5, precoTotal: 15.0 },
            { nome: "Curry", qtd: 7, precoTotal: 21.0 },
            { nome: "Açafrão", qtd: 8, precoTotal: 24.0 },
            { nome: "Picles", qtd: 10, precoTotal: 30.0 },
            { nome: "Alcaparra", qtd: 12, precoTotal: 36.0 }
        ]
    },
    {
        mes: "Junho 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 305, precoTotal: 915.0 },
            { nome: "Feijão", qtd: 255, precoTotal: 765.0 },
            { nome: "Macarrão", qtd: 190, precoTotal: 570.0 },
            { nome: "Sabão", qtd: 165, precoTotal: 495.0 },
            { nome: "Óleo", qtd: 145, precoTotal: 435.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 4, precoTotal: 12.0 },
            { nome: "Curry", qtd: 6, precoTotal: 18.0 },
            { nome: "Açafrão", qtd: 7, precoTotal: 21.0 },
            { nome: "Picles", qtd: 9, precoTotal: 27.0 },
            { nome: "Alcaparra", qtd: 11, precoTotal: 33.0 }
        ]
    },
    {
        mes: "Julho 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 320, precoTotal: 960.0 },
            { nome: "Feijão", qtd: 260, precoTotal: 780.0 },
            { nome: "Macarrão", qtd: 200, precoTotal: 600.0 },
            { nome: "Sabão", qtd: 175, precoTotal: 525.0 },
            { nome: "Óleo", qtd: 160, precoTotal: 480.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 5, precoTotal: 15.0 },
            { nome: "Curry", qtd: 7, precoTotal: 21.0 },
            { nome: "Açafrão", qtd: 8, precoTotal: 24.0 },
            { nome: "Picles", qtd: 10, precoTotal: 30.0 },
            { nome: "Alcaparra", qtd: 12, precoTotal: 36.0 }
        ]
    },
    {
        mes: "Agosto 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 330, precoTotal: 990.0 },
            { nome: "Feijão", qtd: 275, precoTotal: 825.0 },
            { nome: "Macarrão", qtd: 210, precoTotal: 630.0 },
            { nome: "Sabão", qtd: 180, precoTotal: 540.0 },
            { nome: "Óleo", qtd: 170, precoTotal: 510.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 6, precoTotal: 18.0 },
            { nome: "Curry", qtd: 8, precoTotal: 24.0 },
            { nome: "Açafrão", qtd: 9, precoTotal: 27.0 },
            { nome: "Picles", qtd: 11, precoTotal: 33.0 },
            { nome: "Alcaparra", qtd: 13, precoTotal: 39.0 }
        ]
    },
    {
        mes: "Setembro 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 325, precoTotal: 975.0 },
            { nome: "Feijão", qtd: 280, precoTotal: 840.0 },
            { nome: "Macarrão", qtd: 215, precoTotal: 645.0 },
            { nome: "Sabão", qtd: 185, precoTotal: 555.0 },
            { nome: "Óleo", qtd: 175, precoTotal: 525.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 5, precoTotal: 15.0 },
            { nome: "Curry", qtd: 7, precoTotal: 21.0 },
            { nome: "Açafrão", qtd: 8, precoTotal: 24.0 },
            { nome: "Picles", qtd: 10, precoTotal: 30.0 },
            { nome: "Alcaparra", qtd: 12, precoTotal: 36.0 }
        ]
    },
    {
        mes: "Outubro 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 340, precoTotal: 1020.0 },
            { nome: "Feijão", qtd: 290, precoTotal: 870.0 },
            { nome: "Macarrão", qtd: 220, precoTotal: 660.0 },
            { nome: "Sabão", qtd: 190, precoTotal: 570.0 },
            { nome: "Óleo", qtd: 180, precoTotal: 540.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 6, precoTotal: 18.0 },
            { nome: "Curry", qtd: 8, precoTotal: 24.0 },
            { nome: "Açafrão", qtd: 9, precoTotal: 27.0 },
            { nome: "Picles", qtd: 11, precoTotal: 33.0 },
            { nome: "Alcaparra", qtd: 13, precoTotal: 39.0 }
        ]
    },
    {
        mes: "Novembro 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 350, precoTotal: 1050.0 },
            { nome: "Feijão", qtd: 300, precoTotal: 900.0 },
            { nome: "Macarrão", qtd: 230, precoTotal: 690.0 },
            { nome: "Sabão", qtd: 200, precoTotal: 600.0 },
            { nome: "Óleo", qtd: 190, precoTotal: 570.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 5, precoTotal: 15.0 },
            { nome: "Curry", qtd: 7, precoTotal: 21.0 },
            { nome: "Açafrão", qtd: 8, precoTotal: 24.0 },
            { nome: "Picles", qtd: 10, precoTotal: 30.0 },
            { nome: "Alcaparra", qtd: 12, precoTotal: 36.0 }
        ]
    },
    {
        mes: "Dezembro 2024",
        maisVendidos: [
            { nome: "Arroz", qtd: 380, precoTotal: 1140.0 }, // Aumento devido às festas
            { nome: "Feijão", qtd: 320, precoTotal: 960.0 },
            { nome: "Macarrão", qtd: 250, precoTotal: 750.0 },
            { nome: "Sabão", qtd: 220, precoTotal: 660.0 },
            { nome: "Óleo", qtd: 210, precoTotal: 630.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 8, precoTotal: 24.0 }, // Aumento por ser item de receitas festivas
            { nome: "Curry", qtd: 6, precoTotal: 18.0 },
            { nome: "Açafrão", qtd: 7, precoTotal: 21.0 },
            { nome: "Picles", qtd: 9, precoTotal: 27.0 },
            { nome: "Alcaparra", qtd: 10, precoTotal: 30.0 }
        ]
    },
    // ... continuar adicionando meses até Maio 2025 ...
    {
        mes: "Janeiro 2025",
        maisVendidos: [
            { nome: "Arroz", qtd: 360, precoTotal: 1080.0 },
            { nome: "Feijão", qtd: 310, precoTotal: 930.0 },
            { nome: "Macarrão", qtd: 240, precoTotal: 720.0 },
            { nome: "Sabão", qtd: 210, precoTotal: 630.0 },
            { nome: "Óleo", qtd: 200, precoTotal: 600.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 4, precoTotal: 12.0 },
            { nome: "Curry", qtd: 6, precoTotal: 18.0 },
            { nome: "Açafrão", qtd: 7, precoTotal: 21.0 },
            { nome: "Picles", qtd: 9, precoTotal: 27.0 },
            { nome: "Alcaparra", qtd: 11, precoTotal: 33.0 }
        ]
    },
    {
        mes: "Fevereiro 2025",
        maisVendidos: [
            { nome: "Arroz", qtd: 340, precoTotal: 1020.0 },
            { nome: "Feijão", qtd: 295, precoTotal: 885.0 },
            { nome: "Macarrão", qtd: 225, precoTotal: 675.0 },
            { nome: "Sabão", qtd: 195, precoTotal: 585.0 },
            { nome: "Óleo", qtd: 185, precoTotal: 555.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 5, precoTotal: 15.0 },
            { nome: "Curry", qtd: 7, precoTotal: 21.0 },
            { nome: "Açafrão", qtd: 8, precoTotal: 24.0 },
            { nome: "Picles", qtd: 10, precoTotal: 30.0 },
            { nome: "Alcaparra", qtd: 12, precoTotal: 36.0 }
        ]
    },
    {
        mes: "Março 2025",
        maisVendidos: [
            { nome: "Arroz", qtd: 350, precoTotal: 1050.0 },
            { nome: "Feijão", qtd: 285, precoTotal: 855.0 },
            { nome: "Macarrão", qtd: 235, precoTotal: 705.0 },
            { nome: "Sabão", qtd: 205, precoTotal: 615.0 },
            { nome: "Óleo", qtd: 195, precoTotal: 585.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 6, precoTotal: 18.0 },
            { nome: "Curry", qtd: 8, precoTotal: 24.0 },
            { nome: "Açafrão", qtd: 9, precoTotal: 27.0 },
            { nome: "Picles", qtd: 11, precoTotal: 33.0 },
            { nome: "Alcaparra", qtd: 13, precoTotal: 39.0 }
        ]
    },
    {
        mes: "Abril 2025",
        maisVendidos: [
            { nome: "Arroz", qtd: 345, precoTotal: 1035.0 },
            { nome: "Feijão", qtd: 275, precoTotal: 825.0 },
            { nome: "Macarrão", qtd: 225, precoTotal: 675.0 },
            { nome: "Sabão", qtd: 190, precoTotal: 570.0 },
            { nome: "Óleo", qtd: 180, precoTotal: 540.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 5, precoTotal: 15.0 },
            { nome: "Curry", qtd: 7, precoTotal: 21.0 },
            { nome: "Açafrão", qtd: 8, precoTotal: 24.0 },
            { nome: "Picles", qtd: 10, precoTotal: 30.0 },
            { nome: "Alcaparra", qtd: 12, precoTotal: 36.0 }
        ]
    },
    {
        mes: "Maio 2025",
        maisVendidos: [
            { nome: "Arroz", qtd: 360, precoTotal: 1080.0 },
            { nome: "Feijão", qtd: 290, precoTotal: 870.0 },
            { nome: "Macarrão", qtd: 240, precoTotal: 720.0 },
            { nome: "Sabão", qtd: 210, precoTotal: 630.0 },
            { nome: "Óleo", qtd: 200, precoTotal: 600.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 4, precoTotal: 12.0 },
            { nome: "Curry", qtd: 6, precoTotal: 18.0 },
            { nome: "Açafrão", qtd: 7, precoTotal: 21.0 },
            { nome: "Picles", qtd: 9, precoTotal: 27.0 },
            { nome: "Alcaparra", qtd: 11, precoTotal: 33.0 }
        ]
    },
    {
        mes: "Maio 2025",
        maisVendidos: [
            { nome: "Arroz", qtd: 340, precoTotal: 1020.0 },
            { nome: "Feijão", qtd: 300, precoTotal: 900.0 },
            { nome: "Macarrão", qtd: 230, precoTotal: 690.0 },
            { nome: "Sabão", qtd: 200, precoTotal: 600.0 },
            { nome: "Óleo", qtd: 190, precoTotal: 570.0 }
        ],
        menosVendidos: [
            { nome: "Molho Inglês", qtd: 2, precoTotal: 6.0 },
            { nome: "Curry", qtd: 4, precoTotal: 12.0 },
            { nome: "Açafrão", qtd: 5, precoTotal: 15.0 },
            { nome: "Picles", qtd: 7, precoTotal: 21.0 },
            { nome: "Alcaparra", qtd: 8, precoTotal: 24.0 }
        ]
    }
];

let resumo = { hoje: ["2.500,00", "+12"], semana: ["32.000,00", "+5"], mes: ["29.500,00", "+8"] }

function renderizarResumoVendas(Info) {
    if (!Info.hoje) {
        console.error("Dados de vendas do dia não disponíveis.");
        return
    } else if (Info.hoje.length < 2) {
        console.error("Dados insuficientes para renderizar resumo de vendas.");
        return
    } else if (Info.hoje[0] === "0,00") {
        document.getElementById("qnt-hoje").textContent = "R$0,00";
        document.getElementById("prcn-hoje").textContent = "Sem vendas hoje";
    } else {
        document.getElementById("qnt-hoje").textContent = "R$" + Info.hoje[0];
        document.getElementById("prcn-hoje").textContent = Info.hoje[1] + "%" + " em relação ao dia anterior";
    }

    if (!Info.semana) {
        console.error("Dados de vendas da semana não disponíveis.");
        return
    } else if (Info.semana.length < 2) {
        console.error("Dados insuficientes para renderizar resumo de vendas.");
        return
    } else if (Info.semana[0] === "0,00") {
        document.getElementById("qnt-semana").textContent = "R$0,00";
        document.getElementById("prcn-semana").textContent = "Sem vendas semana";
    } else {
        document.getElementById("qnt-semana").textContent = "R$" + Info.semana[0];
        document.getElementById("prcn-semana").textContent = Info.semana[1] + "%" + " em relação ao semana anterior";
    }

    if (!Info.mes) {
        console.error("Dados de vendas do mês não disponíveis.");
        return
    } else if (Info.mes.length < 2) {
        console.error("Dados insuficientes para renderizar resumo de vendas.");
        return
    } else if (Info.hoje[0] === "0,00") {
        document.getElementById("qnt-mes").textContent = "R$0,00";
        document.getElementById("prcn-mes").textContent = "Sem vendas mes";
    } else {
        document.getElementById("qnt-mes").textContent = "R$" + Info.mes[0];
        document.getElementById("prcn-mes").textContent = Info.mes[1] + "%" + " em relação ao mes anterior";
    }
}

function renderizarGraficoABC(Info) {
    if (graficoAtualABC) {
        graficoAtualABC.destroy();
    }

    const ctx = document.getElementById("curvaABCChart").getContext('2d');
    const labels = Info.labels;
    const dados = Info.dados;
    const cores = Info.cores;

    graficoAtualABC = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                backgroundColor: cores,
                borderColor: cores,
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderizarListaVendidos(lista, tipo) {
    let ul;
    if (tipo === "mais") {
        ul = document.getElementById("lista-mais-vendidos");
    } else if (tipo === "menos") {
        ul = document.getElementById('lista-menos-vendidos');
    } else {
        console.error("Tipo inválido para renderizar lista de vendidos.");
        return
    }

    ul.innerHTML = "";

    lista.forEach(item => {
        ul.innerHTML +=
            `<li class="list-group-item d-flex justify-content-between align-items-start">
            <div class="ms-2 me-auto">
                <div class="fw-bold">${item.nome}</div>
                ${item.qtd} unidades
            </div>
            <span class="badge bg-primary rounded-pill">R$ ${item.precoTotal}</span>
        </li>`;

    });
}

// função dos botões de mais e menos vendidos
document.getElementById('mais-vendidos-tab').onclick = () => renderizarListaVendidos(vendasPorMes[mesAtualIndex].maisVendidos, "mais");
document.getElementById('menos-vendidos-tab').onclick = () => renderizarListaVendidos(vendasPorMes[mesAtualIndex].menosVendidos, "menos");

// função do botao de ver o mes anterior
document.getElementById('btn-mes-anterior').onclick = () => {
    if (mesAtualIndex > 0) {
        mesAtualIndex--;
        renderizarGraficoFinanceiro([dadosFinanceirosPorMes[mesAtualIndex]]);
        renderizarGraficoABC(vendasPorClasse[mesAtualIndex]);
        renderizarListaVendidos(vendasPorMes[mesAtualIndex].maisVendidos, "mais");
        renderizarListaVendidos(vendasPorMes[mesAtualIndex].menosVendidos, "menos");
        renderizarProdutosEncalhados(produtosEncalhados[mesAtualIndex].produtos);
        atualizarLabelMes();
    }
};

// função do botao de ver o proximo mes
document.getElementById('btn-proximo-mes').onclick = () => {
    if (mesAtualIndex < dadosFinanceirosPorMes.length - 1) {
        mesAtualIndex++;
        renderizarGraficoFinanceiro([dadosFinanceirosPorMes[mesAtualIndex]]);
        renderizarGraficoABC(vendasPorClasse[mesAtualIndex]);
        renderizarListaVendidos(vendasPorMes[mesAtualIndex].maisVendidos, "mais");
        renderizarListaVendidos(vendasPorMes[mesAtualIndex].menosVendidos, "menos");
        renderizarProdutosEncalhados(produtosEncalhados[mesAtualIndex].produtos);
        atualizarLabelMes();
    }
};

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const mes = dadosFinanceirosPorMes[mesAtualIndex];
    doc.text(`Relatório Financeiro - ${mes.mes}`, 10, 10);
    doc.text(`Receita: R$ ${mes.receita}`, 10, 20);
    doc.text(`Despesa: R$ ${mes.despesa}`, 10, 30);
    doc.text(`Lucro: R$ ${mes.lucro}`, 10, 40);
    doc.save(`relatorio-financeiro-${mes.mes}.pdf`);
}

function exportarCSV() {
    const mes = dadosFinanceirosPorMes[mesAtualIndex];
    const csv = Papa.unparse([
        ["Mês", "Receita", "Despesa", "Lucro"],
        [mes.mes, mes.receita, mes.despesa, mes.lucro]
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorio-financeiro-${mes.mes}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderizarGraficoFinanceiro(dados) {
    if (graficoAtualFinanceiro) {
        graficoAtualFinanceiro.destroy();
    }

    const titulo = document.getElementById("titulo-financeiro");
    titulo.textContent = `Relatório Financeiro - ${dados[0].mes}`;

    const ctx = document.getElementById("graficoFinanceiro").getContext('2d');

    const labels = dados.map(item => item.mes);
    const receita = dados.map(item => item.receita);
    const despesa = dados.map(item => item.despesa);
    const lucro = dados.map(item => item.lucro);

    graficoAtualFinanceiro = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receita Bruta (R$)',
                    data: receita,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Despesa (R$)',
                    data: despesa,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Lucro Líquido (R$)',
                    data: lucro,
                    backgroundColor: 'rgba(255, 193, 7, 0.7)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function atualizarLabelMes() {
    let mes = `Mês: ${dadosFinanceirosPorMes[mesAtualIndex].mes}`;
    document.getElementById("titulo-mes-atual").textContent = mes;
    document.getElementById("titulo-mes-abc").textContent = mes;
    document.getElementById("titulo-mes-encalhado").textContent = mes;
    document.getElementById("titulo-mes-mmv").textContent = mes;
}

function renderizarProdutosEncalhados(produtos) {
    const ul = document.getElementById("lista-encalhados");
    ul.innerHTML = ""; // Limpa a lista antes de renderizar
    produtos.forEach(item => {
        ul.innerHTML +=
            `<div class="list-group">
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${item.nome}</h6>
                    <small class="text-danger">${item.validade}</small>
                </div>
                <p class="mb-1 small">Estoque: ${item.estoque} unidades</p>
                <p class="mb-1 small">Codigo: ${item.codigo} | Lote: ${item.lote}</p>
                <small class="text-muted">Última venda: ${item.ultimaVenda}</small>
            </div>
        </div>`
    });
}

function gerarRelatorios() {
    //fazer calculos e gerar os dados necessários para os relatórios
}

atualizarLabelMes()
renderizarResumoVendas(resumo);
renderizarGraficoFinanceiro([dadosFinanceirosPorMes[mesAtualIndex]]);
renderizarGraficoABC(vendasPorClasse[mesAtualIndex]);
renderizarListaVendidos(vendasPorMes[mesAtualIndex].maisVendidos, "mais");
renderizarListaVendidos(vendasPorMes[mesAtualIndex].menosVendidos, "menos");
renderizarProdutosEncalhados(produtosEncalhados[mesAtualIndex].produtos);
