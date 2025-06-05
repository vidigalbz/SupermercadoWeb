const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite')

db.serialize(() => {
    db.exec(`
CREATE TABLE IF NOT EXISTS supermarkets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marketId TEXT UNIQUE,
    createdAt TEXT,
    name TEXT NOT NULL,
    local TEXT NOT NULL,
    icon TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    FOREIGN KEY (ownerId) REFERENCES users(userId)
);

CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    gestor BOOL NOT NULL,
    pdv BOOL NOT NULL DEFAULT 0,
    estoque BOOL NOT NULL DEFAULT 0,
    fornecedor BOOL NOT NULL DEFAULT 0,
    relatorios BOOL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    productId INTEGER PRIMARY KEY AUTOINCREMENT,
    marketId TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    departament TEXT,
    stock INTEGER DEFAULT 0,
    lot TEXT,
    expirationDate TEXT,
    manufactureDate TEXT,
    barcode TEXT NOT NULL,
    image TEXT,
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId)
);

CREATE TABLE IF NOT EXISTS sales (
    saleId INTEGER PRIMARY KEY AUTOINCREMENT,
    marketId INTEGER NOT NULL,
    total REAL NOT NULL,
    paymentMethod TEXT NOT NULL,
    saleDate TEXT NOT NULL,
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId)
);

CREATE TABLE IF NOT EXISTS sale_items (
    itemId INTEGER PRIMARY KEY AUTOINCREMENT,
    saleId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unitPrice REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (saleId) REFERENCES sales(saleId),
    FOREIGN KEY (productId) REFERENCES products(productId)
);

CREATE TABLE IF NOT EXISTS setors (
    itemId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    marketId TEXT NOT NULL,
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId)
);

CREATE TABLE IF NOT EXISTS historico_produto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_supermercado TEXT NOT NULL,
    produto TEXT NOT NULL,
    acao TEXT NOT NULL,
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    data_modificacao TEXT NOT NULL,
    usuario_responsavel TEXT
);

CREATE TABLE IF NOT EXISTS historico_usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario TEXT NOT NULL,
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    data_modificacao TEXT NOT NULL,
    motivo TEXT,
    alterado_por TEXT
);

CREATE TABLE IF NOT EXISTS relatorio_entrada (
    entrada_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_supermercado TEXT NOT NULL,
    cnpj_fornecedor TEXT NOT NULL,
    numero_nota_fiscal TEXT NOT NULL,
    data_entrada TEXT NOT NULL,
    produto TEXT NOT NULL,
    preco_unitario REAL NOT NULL,
    preco_total REAL NOT NULL,
    categoria TEXT,
    departamento TEXT,
    estoque INTEGER DEFAULT 0,
    lote TEXT,
    data_validade TEXT,
    data_fabricacao TEXT,
    codigo_barras TEXT NOT NULL,
    imagem TEXT,
    tributos_simulados TEXT NOT NULL,
    FOREIGN KEY (id_supermercado) REFERENCES supermarkets(marketId)
);

CREATE TABLE IF NOT EXISTS relatorio_saida (
    saida_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_supermercado TEXT NOT NULL,
    id_caixa TEXT NOT NULL,
    id_notafisca TEXT NOT NULL,
    cpf_cliente TEXT,
    produto TEXT NOT NULL,
    quantidade TEXT NOT NULL,
    preco_unitario REAL NOT NULL,
    preco_total REAL NOT NULL,
    data_saida TEXT NOT NULL,
    horario_saida TEXT NOT NULL,
    tributos_simulados TEXT NOT NULL,
    FOREIGN KEY (id_supermercado) REFERENCES supermarkets(marketId)
);

CREATE TABLE IF NOT EXISTS relatorio_abc (
    abc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_supermercado TEXT NOT NULL,
    id_caixa TEXT NOT NULL,
    produto TEXT NOT NULL,
    quantidade_vendida TEXT NOT NULL,
    preco_total REAL NOT NULL,
    FOREIGN KEY (id_supermercado) REFERENCES supermarkets(marketId)
    );

    CREATE TABLE IF NOT EXISTS history (
    historyId INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    marketId TEXT NOT NULL,
    type TEXT NOT NULL,
    beforeData TEXT,
    afterData TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(productId),
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId)
);
`);
});

function select(table, condition = "", params = []) {
    return new Promise((resolve, reject) => {
        var query = `SELECT * FROM ${table} ${condition}`;

        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    })
}

function insert(table, columns, values) {
    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    db.run(query, values, (err) => {
        if (err) {
            return console.log(`Erro: ${err}`);
        }
    });
}

function update(table, columns, values, condition = ""){
    multiColumns = columns.map(col => `${col} = ?`).join(', ')
    var query = `UPDATE ${table} SET ${multiColumns} ${condition ? "WHERE " + condition : ""}`

    db.run(query, values ,(err) => {
        if (err) {
            return console.log(`Erro: ${err}`)
        }

    })
}

function delet(table, condition){
    db.run(`DELETE FROM ${table} WHERE ${condition}`)
}

function query(query){
    db.run(query, (err) => {
        if (err) {
            console.log(`Erro: ${err}`)
        }
    })
}

async function insertLink(key, marketId, type) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO accessKeys (key, marketId, type) VALUES (?, ?, ?)`,
            [key, marketId, type],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

module.exports = {
    insert,
    select,
    update,
    delet,
    query,
    insertLink,
    db
}