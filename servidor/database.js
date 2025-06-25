const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco:", err.message);
        return;
    }
    db.run("PRAGMA foreign_keys = ON", (pragmaErr) => {
        if (pragmaErr) {
            console.error("Erro ao habilitar foreign keys:", pragmaErr.message);
        }
    });
    console.log("Conectado ao banco de dados SQLite com foreign keys ON.");
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    db.exec(`
CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    profileImage TEXT,
    gestor BOOL NOT NULL
);

CREATE TABLE IF NOT EXISTS supermarkets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marketId TEXT UNIQUE NOT NULL,
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
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE,
    UNIQUE(name, type, marketId)
);

CREATE TABLE IF NOT EXISTS history (
    historyId INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER,
    marketId TEXT NOT NULL,
    userId INTEGER NOT NULL,
    type TEXT NOT NULL,
    beforeData TEXT,
    afterData TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(productId) ON DELETE SET NULL,
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    marketId TEXT NOT NULL,
    pdv BOOL NOT NULL DEFAULT 0,
    estoque BOOL NOT NULL DEFAULT 0,
    fornecedor BOOL NOT NULL DEFAULT 0,
    relatorios BOOL NOT NULL DEFAULT 0,
    alertas BOOL NOT NULL DEFAULT 0,
    rastreamento BOOL NOT NULL DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (marketId) REFERENCES supermarkets(marketId),
    UNIQUE(userId, marketId)
);

CREATE TABLE IF NOT EXISTS fornecedores (
    marketId TEXT NOT NULL,
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
);
`);
});

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

async function insertLink(key, marketId, type) {
    try {
        const result = await insert('accessKeys', ['key', 'marketId', 'type'], [key, marketId, type]);
        return result.id;
    } catch (err) {
        console.error(`Erro ao inserir link de acesso: ${err.message}`);
        throw err;
    }
}

module.exports = {
    db,
    select,
    insert,
    update,
    delet,
    query,
    insertLink,
    selectFromRaw,
};