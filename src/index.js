import express from "express";
import path from "path";
import collection from "./config.js";
import ItemCollection from "./config_item.js";
import bcrypt from 'bcrypt';
import inquirer from 'inquirer';

const app = express();
// convert data into json format
app.use(express.json());
// Static file
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));
//use EJS as the view engine


app.set("view engine", "ejs");



app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/adminlogin", (req, res) => {
    res.render("adminlogin");
});

app.get("/admin", (req, res) => {
    res.render("admin");
});

app.get("/menu", (req, res) => {
    res.render("menu");
});

app.post("/menu", async (req, res) => {
    const action = req.body.action;
    if (action === 'Criar um novo item') {
        res.render("createItem");
    } else if (action === 'Promover um usuário a administrador') {
        res.render("makeAdmin");
    } else if (action === 'Sair') {
        res.redirect("/login");
    }
});

// Register User
app.post("/signup", async (req, res) => {
    const { rf, name, cpf, password, authenticPassword } = req.body;

    if(password !== authenticPassword) {
        return res.status(400).json({ message: "As senhas não correspondem" });
    }

    try {
        const existingRF = await collection.findOne({ $or: [{ rf }, { cpf }] });

        if (existingRF) {
            return res.status(409).json({ message: 'RF ou CPF já cadastrado.' });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new collection({ rf, name, cpf, password: hashedPassword });
            await user.save();
            return res.status(200).json({ message: 'Usuario criado com sucesso.'});
            
        }
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        return res.status(500).json({ message: 'Problema no servidor interno' });
    }
});



// Login user 
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ rf: req.body.rf });
        if (!check) {
            return res.send("RF não encontrado")
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.send("senha incorreta");
        }
        else {
            res.render("home");
        }
    }
    catch {
        res.send("detalhes incorretos");
    }
});

// Login adm
app.post("/adminlogin", async (req, res) => {
    // Supondo que você tenha uma função 'getUser' que retorna um usuário com base no nome de usuário
    const user = await collection.findOne({rf: req.body.rf});
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        if (user.isAdmin) {
            // Redirecionar para a área de gestão se o usuário for um administrador
            res.redirect("admin");
        } else {
            // Redirecionar de volta para a página de login do administrador se o usuário não for um administrador
            res.status(409).json({message: 'Este usuario nao possui permissao'});
        }
    } 
});


// Menu Adm
app.post("/admin", async (req, res) => {
    const option = req.body.option;
    switch (option) {
        case 'promote':
            res.redirect("/makeadmin");
            break;
        case 'exit':
            process.exit();
    }
});

// Create Item
app.post('/createitem', async (req, res) => {
    const { nome, descricao, preco } = req.body;

    // Verifique se todos os campos necessários estão presentes
    if (!nome || !descricao || !preco) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos necessários.' });
    }

    // Crie um novo item com os dados do corpo da solicitação
    const newItem = new ItemCollection({
        nome,
        descricao,
        preco
    });

    try {
        // Salve o novo item no banco de dados
        const savedItem = await newItem.save();

        // Envie uma resposta com o item salvo
        res.json(savedItem);
    } catch (err) {
        // Envie uma resposta de erro se algo der errado
        res.status(500).json({ message: err.message });
    }
});

// Promote

app.post("/makeAdmin", async (req, res) => {
    try {
        const user = await collection.findOne({ rf: req.body.rf });
        if (!user) {
            res.send("RF não encontrado")
        }
        else {
            user.isAdmin = true;
            await user.save();
            res.send("Usuario é agora um administrador");
        }
    }
    catch {
        res.send("Ocorreu um erro");
    }
}); 



// Define Port for Application
const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});