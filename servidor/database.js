const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

// Habilita verificação de chaves estrangeiras
db.get("PRAGMA foreign_keys = ON");

// Criação das tabelas na ordem correta
db.serialize(() => {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        userId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supermarkets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marketId TEXT UNIQUE,
        createdAt TEXT,
        name TEXT NOT NULL,
        local TEXT NOT NULL,
        icon TEXT NOT NULL,
        ownerId INTEGER NOT NULL,
        FOREIGN KEY (ownerId) REFERENCES users(userId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS accessKeys (
        keyId INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        marketId TEXT NOT NULL,
        type TEXT NOT NULL,
        FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE
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
        FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales (
        saleId INTEGER PRIMARY KEY AUTOINCREMENT,
        marketId TEXT NOT NULL,
        total REAL NOT NULL,
        paymentMethod TEXT NOT NULL,
        saleDate TEXT NOT NULL,
        FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sale_items (
        itemId INTEGER PRIMARY KEY AUTOINCREMENT,
        saleId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (saleId) REFERENCES sales(saleId) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(productId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS setors (
        itemId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        marketId TEXT NOT NULL,
        FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS history (
        historyId INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        marketId TEXT NOT NULL,
        type TEXT NOT NULL,
        beforeData TEXT,
        afterData TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products(productId) ON DELETE CASCADE,
        FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE
    );
    `);
});

// Funções do banco de dados com tratamento de erros melhorado
function select(table, where = '', params = []) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ${table} ${where}`;
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error(`Erro na consulta SELECT: ${err.message}`);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function insert(table, columns, values) {
    return new Promise((resolve, reject) => {
        const placeholders = columns.map(() => '?').join(', ');
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        db.run(query, values, function(err) {
            if (err) {
                console.error(`Erro na inserção: ${err.message}`);
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
}

function update(table, columns, values, condition = "") {
    return new Promise((resolve, reject) => {
        const multiColumns = columns.map(col => `${col} = ?`).join(', ');
        const query = `UPDATE ${table} SET ${multiColumns} ${condition ? "WHERE " + condition : ""}`;

        db.run(query, values, function(err) {
            if (err) {
                console.error(`Erro na atualização: ${err.message}`);
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

function delet(table, condition, params = []) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM ${table} WHERE ${condition}`;
        
        db.run(query, params, function(err) {
            if (err) {
                console.error(`Erro na exclusão: ${err.message}`);
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

function query(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                console.error(`Erro na query: ${err.message}`);
                reject(err);
            } else {
                resolve({ changes: this.changes, lastID: this.lastID });
            }
        });
    });
}

function selectFromRaw(queryText, params = []) {
    return new Promise((resolve, reject) => {
        db.all(queryText, params, (err, rows) => {
            if (err) {
                console.error(`Erro no SELECT raw: ${err.message}`);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}


async function insertLink(key, marketId, type) {
    try {
        const result = await insert('accessKeys', ['key', 'marketId', 'type'], [key, marketId, type]);
        return result.id;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    insert,
    select,
    update,
    delet,
    query,
    insertLink,
    selectFromRaw,
    db
};
