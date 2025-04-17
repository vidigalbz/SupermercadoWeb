const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite')

db.serialize(() => {
    db.exec(`
CREATE TABLE IF NOT EXISTS accessKeys (
    key TEXT PRIMARY KEY,
    expiresIn TEXT,
    marketId TEXT,
    type TEXT,
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId)
);

CREATE TABLE IF NOT EXISTS supermarkets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marketId TEXT UNIQUE NOT NULL,
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
    marketId INTEGER NOT NULL,
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

module.exports = {
    insert,
    select,
    update,
    delet,
    query,
    db
}