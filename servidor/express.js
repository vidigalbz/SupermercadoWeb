const { error } = require("console");
const express = require("express");
const {select, insert, update, delet} = require("./database.js")
const app = express();
const port = 4000;

const fs = require("fs")
const path = require('path')

var webpages_dir = path.join(__dirname, "../webpages")
var pages = []

app.use(express.json())

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

app.post('/estoqueData', async (req, res) => {
    const param = req.query
    var sqliteData = {};    

    select("products", condition=param.conditional)
    .then(results => {
        if (param !=  null) {
            return res.status(201).json({
                mensagem:  results
            })
    }})
})

laodPages()

//forma de usar select:
//select("users")
  //  .then(results => {
  //      console.log(results);
   // })

app.listen(port, () => {
    console.log(`Servidor iniciado na porta localhost/${port}`)
})