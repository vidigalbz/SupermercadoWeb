const { insert, select, update, delet } = require('../database.js');

const cadastro = async (req, res) => {
  const { name, password, gestor } = req.body;
  console.log("[CADASTRO] Dados recebidos:", { name, password, gestor });

  if (!name || !password) {
    console.warn("[CADASTRO] Campos obrigatórios faltando.");
    return res.status(400).json({
      status: "error",
      message: "Todos os campos são obrigatórios."
    });
  }

  try {
    const existingAccount = await select("users", "WHERE name = ?", [name]);
    console.log("[CADASTRO] Verificando existência:", existingAccount);

    if (existingAccount.length > 0) {
      console.warn("[CADASTRO] Usuário já existe:", name);
      return res.status(409).json({
        status: "error",
        message: "Usuário já existente!"
      });
    }

    console.log("[CADASTRO] Inserindo novo usuário...");
    await insert("users", ["name", "password", "gestor"], [name, password, gestor]);

    const users = await select("users", "WHERE name = ?", [name]);
    const user = users[0];

    console.log("[CADASTRO] Cadastro finalizado com sucesso:", user);

    res.status(200).json({
      status: "success",
      message: "Usuário cadastrado com sucesso.",
      userId: user.userId,
      name: user.name,
      gestor: user.gestor
    });
  } catch (err) {
    console.error("[CADASTRO] Erro inesperado:", err);
    res.status(500).json({
      status: "error",
      message: "Erro ao cadastrar usuário."
    });
  }
};

const login = async (req, res) => {
  let { name, senha } = req.body;
  try {
    const users = await select("users", "WHERE name = ?", [name]);
    if (users.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Usuário não cadastrado!"
      });
    }
    const user = users[0];
    if (senha !== user.password) {
      return res.status(401).json({
        status: "error",
        message: "Senha incorreta!"
      });
    }
    res.status(200).json({
      status: "success",
      id: user.userId,
      name: user.name,
      userId: user.userId,
      gestor: user.gestor,
      profileImage: user.profileImage || null
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({
      status: "error",
      message: "Erro no servidor."
    });
  }
};

const loginWithId = async (req, res) => {
  let { id } = req.body;
  try {
    let user = await select("users", "WHERE userId = ?", [id]);
    if (!user || user.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }
    user = user[0];
    res.status(200).json({
      status: "success",
      id: user.userId,
      name: user.name,
      gestor: user.gestor,
      profileImage: user.profileImage || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error"
    }); 
  }
};

const getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const users = await select("users", "WHERE userId = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }
    const user = users[0];
    res.status(200).json({
      status: "success",
      data: {
        userId: user.userId,
        name: user.name,
        gestor: user.gestor,
        profileImage: user.profileImage || null
      }
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};

module.exports = {
    cadastro,
    login,
    loginWithId,
    getUserById
};