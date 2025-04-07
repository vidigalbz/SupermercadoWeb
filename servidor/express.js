const { error } = require("console");
const express = require("express");
const {select, Insert} = require("./database.js")
const app = express();
const port = 4000;
const router = express.Router();

const fs = require("fs")
const path = require('path')

var webpages_dir = path.join(__dirname, "../webpages")
var pages = []

async function laodPages () {
    app.use(express.static(webpages_dir))
    await fs.readdir(webpages_dir, (err, arquivos) => {
        if (err){
            return  err
        }
        pages = arquivos.filter(arquivo => {
            const caminho = path.join(webpages_dir, arquivo);
            return fs.statSync(caminho).isDirectory();
        })
      
        for (let i = 0; i < pages.length; i++) {
            temp_path = `${webpages_dir}/${pages[i]}/index.html`
            console.log(temp_path)
            if (fs.existsSync(temp_path) && pages[i] != "main"){
                app.get(`/${pages[i]}`, (req, res) => {
                    res.sendFile(temp_path)
                })
                console.log("caminho adicionado")
            }
            else if (pages[i] == "main"){
                app.get("/", (req, res) => {
                    res.sendFile(temp_path)
                })
            }
            else {
                console.log("caminho nao encontrado")
            }
        }
    })
}

laodPages()

retorno = select("users");
console.log(retorno)

columns = ['userId', 'email', 'password']
values = ["1", "1212212@gmail.com", "331313"]


app.listen(port, () => {
    console.log(`Servidor iniciado na porta localhost/${port}`)
})