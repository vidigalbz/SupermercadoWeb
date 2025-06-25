const { insert, select, update, delet } = require('../database.js');

const funcionarios = async (req, res) => {
  const {marketId, userId} = req.body;
  if (marketId && !userId){
    const funcionarios = await select("user_permissions", "WHERE marketId = ?", [marketId])
    if (funcionarios.length >= 0){
      return res.status(200).json({
        status: "success",
        message: funcionarios
      })
    }
    else {
      return res.status(404).json({
        status: "error",
        status: "nenhum funcionario encontrado!"
      })
    }
  }
}

const updateFuncionarios = async (req, res) => {
    console.log("foi chamada sim!")
  const {type, userData, marketId} = req.body;

  if (type == "update"){
    try {
      await update('user_permissions', ['pdv', 'estoque','fornecedor', 'relatorios', 'alertas', 'rastreamento'], userData.permissoes, `userid = ${userData.userId} AND marketId = '${marketId}'`); 
      res.status(200).json({
        status: "success",
        message: "Permissões Atualizadas!"
      })
    }
    catch {
      res.status(404).json({
        status: "error",
        message: "Erro ao atualizar usuário"
      })
    }
    
  }
  else if (type == "delete"){
    try {
      await delet("user_permissions", `userId = '${userData.userId}' AND marketId = '${marketId}'`);
      console.log("usuario removido!")
      res.status(200).json({
        status: "success",
        message: "Erro ao remover Funcionario!"
      })
    }
    catch {
      res.status(404).json({
        status: "error",
        message: "Erro ao remover usuário"
      })
    }
  }
  else if (type == "insert") {
    try {
      tableData = await select("user_permissions", "WHERE userId = ? AND marketId = ?", [userData.userId, marketId])
      if (tableData.length > 0) {
        console.log("Usuário já cadastrado!")
        return res.status(409).json({
          status: "error",
          message: "Usuário já cadastrado!"
        });
      }
      else {
        insert(
          "user_permissions", 
          ["userId", "marketId", "pdv", "estoque", "fornecedor", "relatorios", "alertas", "rastreamento"], 
          [userData.userId, marketId, userData.permissoes[0], userData.permissoes[1], userData.permissoes[2], userData.permissoes[3], userData.permissoes[4], userData.permissoes[5]]
        );

        return res.status(200).json({
          status: "success",
          message: "Funcionário cadastrado com sucesso!"
        });
      }
    } catch (err) {
      console.error("Erro ao adicionar usuário:", err);
        return res.status(500).json({
          status: "error",
          message: "Erro interno ao adicionar funcionário"
        });
      }
  }
};

module.exports = {
    funcionarios,
    updateFuncionarios
}