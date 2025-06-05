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
    email TEXT UNIQUE,
    password TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS fornecedores (
    cnpj INTENGER NOT NULL UNIQUE,
    razao_social TEXT NOT NULL,
    inscricao_estadual TEXT NOT NULL,
    endereco TEXT NOT NULL,
    contato TEXT NOT NULL,
    tipo_de_produto TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS comprarfornecedor (
    compraId INTEGER PRIMARY KEY AUTOINCREMENT,
    cnpj TEXT NOT NULL,
    productId INTEGER NOT NULL,
    quantidade_produto REAL NOT NULL,
    data_compra TEXT NOT NULL,
    preco_unitario REAL NOT NULL,
    subtotal_produto REAL NOT NULL,
    valor_final REAL NOT NULL,
    FOREIGN KEY (cnpj) REFERENCES fornecedores(cnpj),
    FOREIGN KEY (productId) REFERENCES products(productId)
);`
);
});

db.run(`ALTER TABLE products ADD COLUMN supplier TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.error("Erro ao adicionar coluna 'supplier':", err.message);
    }
});

db.run(`ALTER TABLE products ADD COLUMN price_per_unity REAL`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.error("Erro ao adicionar coluna 'price_per_unity':", err.message);
    }
});

db.run(`ALTER TABLE products ADD COLUMN valortotal REAL`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.error("Erro ao adicionar coluna 'valortotal':", err.message);
    }
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

