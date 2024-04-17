import express from "express";
import path from "path";
import collection from "./config.js";
import ItemCollection from "./config_item.js";
import bcrypt from 'bcrypt';
import inquirer from 'inquirer';
import Swal from 'sweetalert2'
import session from 'express-session';

const app = express();
// convert data into json format
app.use(express.json());
// Static file
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));
//use EJS as the view engine

app.use(session({
    secret: 'sua-chave-secreta-aqui',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Defina como true se estiver em um ambiente de produção com HTTPS
  }));


app.set("view engine", "ejs");

// Functions
function checkUserLoggedIn(req, res, next) {
    if (req.session && req.session.user) {
      next(); // O usuário está logado, continue para a próxima função middleware/route
    } else {
      res.redirect('/login'); // O usuário não está logado, redirecione para a página de login
    }
  }

// Gets

app.get('/check-session', (req, res) => {
    res.send(`Dados da sessão: ${JSON.stringify(req.session)}`);
  });
  
app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/adminlogin", (req, res) => {
    res.render("adminlogin");
});

app.get("/menu", (req, res) => {
    res.render("menu");
});

app.get("/createitem", (req, res) => {
    res.render("createitem");
});

app.get("/makeAdmin", (req, res) => {
    res.render("makeAdmin");
});

app.get("/home", checkUserLoggedIn, (req, res) => {
    res.render("home");
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
            const user = new collection({ rf, name, cpf, password: hashedPassword, authenticPassword });
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
            return res.json({ status: 'error', message: 'RF não encontrado' });
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.json({ status: 'error', message: 'Senha incorreta' });
        }
        else {
            req.session.user = check; // Armazenando o usuário na sessão
            return res.json({ status: 'success', message: 'home' });
        }
    }
    catch {
        return res.json({ status: 'error', message: 'Detalhes incorretos' });
    }
});


// Login adm
app.post("/adminlogin", async (req, res) => {
    const user = await collection.findOne({rf: req.body.rf});
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        if (user.isAdmin) {
            res.status(200).json({redirect: '/menu'});
        } else {
            res.status(409).json({message: 'Este usuario nao possui permissao'});
        }
    } else {
        res.status(401).json({message: 'Credenciais invalidas'});
    }
});



// Menu Adm
app.post("/menu", async (req, res) => {
    const action = req.body.action;
    if (action === 'Criar um novo item') {
        res.render("createitem");
    } else if (action === 'Promover um usuário a administrador') {
        res.render("makeAdmin");
    } else if (action === 'Sair') {
        res.redirect("/home");
    }
});

// Create Item
app.post('/createitem', async (req, res) => {
    const { nome, descricao, portas, tipos_de_portas, portas_adicionais, tipos_de_portas_adicionais, protocolos, altura, largura, memoria, processador, MAC, performance, Capacidade_de_encaminhamento, capacidade_de_computacao, Frequência, watts } = req.body;

    // Verifique se todos os campos necessários estão presentes
    if (!nome || !descricao) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos necessários.' });
    }

    // Crie um novo item com os dados do corpo da solicitação
    const newItem = new ItemCollection({
        nome,
        descricao,
        portas,
        tipos_de_portas,
        portas_adicionais,
        tipos_de_portas_adicionais,
        protocolos,
        altura,
        largura,
        memoria,
        processador,
        MAC,
        performance,
        Capacidade_de_encaminhamento,
        capacidade_de_computacao,
        Frequência,
        watts
    });

    try {
        await newItem.save();
        return res.status(200).json({message: 'Item criado com sucesso'});
    } catch (err) {
        // Envie uma resposta de erro se algo der errado
        return res.status(500).json({ message: err.message });
    }
});

// Promote

app.post('/makeAdmin', async (req, res) => {
    try {
        const user = await collection.findOne({ rf: req.body.rf });
        if (!user) {
            res.json({ success: false, message: 'Usuário não encontrado' });
            return;
        }

        user.isAdmin = true;
        await user.save();

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Ocorreu um erro' });
    }
});



// Define Port for Application
const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});