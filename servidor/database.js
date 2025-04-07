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
    marketId TEXT PRIMARY KEY,
    createdAt TEXT,
    name TEXT,
    ownerId TEXT,
    FOREIGN KEY (ownerId) REFERENCES users(userId)
);

CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT
);

CREATE TABLE IF NOT EXISTS products (
    productId INTEGER PRIMARY KEY AUTOINCREMENT,
    marketId TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    lot TEXT,
    department TEXT, 
    expirationDate TEXT, 
    manufactureDate TEXT,
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId)
);`)});



function Insert(table, columns, values){
    db.run(`INSERT INTO ${table} (${columns.join(',')}) VALUES (?, ?, ?)`, values ,(err) => {
        if (err) {
            return console.log(`Erro: ${err}`)
        }
    })
}

function Query(query){
    db.run(query, (err) => {
        if (err) {
            console.log(`Erro: ${err}`)
        }
    })
}

module.exports = {
    Insert, 
    db
}