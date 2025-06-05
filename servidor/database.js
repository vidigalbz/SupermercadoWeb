const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco:", err.message);
        return;
    }
    // Ensure PRAGMA foreign_keys is effective for every connection if needed,
    // but db.serialize runs this for the setup connection.
    // For runtime, it's good practice to ensure it's on for each connection if they are separate.
    // Here, 'db' is a single, persistent connection, so this initial PRAGMA should suffice.
    db.run("PRAGMA foreign_keys = ON", (pragmaErr) => {
        if (pragmaErr) {
            console.error("Erro ao habilitar foreign keys:", pragmaErr.message);
        }
    });
    console.log("Conectado ao banco de dados SQLite com foreign keys ON.");
});

// Criação das tabelas na ordem correta
db.serialize(() => {
    // This PRAGMA here ensures it's on before table creation for this sequence of operations.
    db.run("PRAGMA foreign_keys = ON");

    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        userId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL -- Store hashed passwords
    );

    CREATE TABLE IF NOT EXISTS supermarkets (
        id INTEGER PRIMARY KEY AUTOINCREMENT, -- Internal SQLite rowid alias
        marketId TEXT UNIQUE NOT NULL,     -- Public facing unique ID for the market
        createdAt TEXT NOT NULL,
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
        type TEXT NOT NULL, -- e.g., 'pdv', 'estoque'
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
        barcode TEXT NOT NULL, -- Should this be unique per marketId or globally? Consider constraints.
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
        FOREIGN KEY (productId) REFERENCES products(productId) ON DELETE CASCADE -- Or SET NULL / RESTRICT depending on desired behavior
    );

    CREATE TABLE IF NOT EXISTS setors (
        itemId INTEGER PRIMARY KEY AUTOINCREMENT, -- Consider renaming to setorId for clarity
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- 'cat' or 'dept'
        marketId TEXT NOT NULL,
        FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE,
        UNIQUE(name, type, marketId) -- Ensure sector names are unique within a type and market
    );

    CREATE TABLE IF NOT EXISTS history (
        historyId INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER, -- Nullable if product can be deleted but history retained without ON DELETE CASCADE
        marketId TEXT NOT NULL,
        userId INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'entrada', 'saida', 'edicao', 'remocao'
        beforeData TEXT,    -- JSON string
        afterData TEXT,     -- JSON string
        createdAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products(productId) ON DELETE SET NULL, -- Changed from CASCADE to SET NULL to keep history if product is deleted
        FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabelas:", err.message);
        } else {
            console.log("Tabelas verificadas/criadas com sucesso.");
        }
    });
});

// Funções do banco de dados com tratamento de erros melhorado
function select(table, where = '', params = []) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ${table} ${where}`;
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error(`Erro na consulta SELECT (${table}): ${err.message}`);
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

function insert(table, columns, values) {
    return new Promise((resolve, reject) => {
        if (!columns || !values || columns.length !== values.length) {
            return reject(new Error("Colunas e valores devem ter o mesmo tamanho"));
        }

        const placeholders = columns.map(() => '?').join(', ');
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        db.run(query, values, function(err) {
            if (err) {
                console.error(`Erro na inserção (${table}): ${err.message}`);
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

function update(table, columns, values, condition, conditionParams = []) {
    return new Promise((resolve, reject) => {
        if (!columns || !values || columns.length !== values.length) {
            return reject(new Error("Colunas e valores devem ter o mesmo tamanho"));
        }

        const setClause = columns.map(col => `${col} = ?`).join(', ');
        // Condition should be a parameterized string, e.g., "productId = ?"
        // Values for setClause come first, then values for conditionParams
        const query = `UPDATE ${table} SET ${setClause} ${condition ? "WHERE " + condition : ""}`;
        const allParams = [...values, ...conditionParams];

        db.run(query, allParams, function(err) {
            if (err) {
                console.error(`Erro na atualização (${table}): ${err.message}`);
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

function delet(table, condition, params = []) {
    return new Promise((resolve, reject) => {
        if (!condition) {
            return reject(new Error("Condição de exclusão não fornecida"));
        }
        // Condition should be a parameterized string, e.g., "productId = ?"
        const query = `DELETE FROM ${table} WHERE ${condition}`;
        
        db.run(query, params, function(err) {
            if (err) {
                console.error(`Erro na exclusão (${table}): ${err.message}`);
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

// Generic query execution (for potentially complex queries not covered by helpers)
function query(queryText, params = []) {
    return new Promise((resolve, reject) => {
        db.run(queryText, params, function(err) {
            if (err) {
                console.error(`Erro na query: ${err.message}`);
                reject(err);
            } else {
                resolve({ changes: this.changes, lastID: this.lastID });
            }
        });
    });
}

// Generic select raw query execution
function selectFromRaw(queryText, params = []) {
    return new Promise((resolve, reject) => {
        db.all(queryText, params, (err, rows) => {
            if (err) {
                console.error(`Erro no SELECT raw: ${err.message}`);
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

// This function seems specific and might be better placed in a service layer
// if your application grows, but it's fine here for now.
async function insertLink(key, marketId, type) {
    try {
        const result = await insert('accessKeys', ['key', 'marketId', 'type'], [key, marketId, type]);
        return result.id;
    } catch (err) {
        console.error(`Erro ao inserir link de acesso: ${err.message}`);
        throw err; // Re-throw to be handled by the caller
    }
}

module.exports = {
    db, // Exporting the db instance directly can be useful but also risky if not handled carefully.
    select,
    insert,
    update,
    delet,
    query,
    insertLink,
    selectFromRaw,
};