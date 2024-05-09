import express from "express";
import path from "path";
import collection from "./config.js";
import ItemCollection from "./config_item.js";
import paginas from "./config_pagina.js";
import bcrypt from 'bcrypt';
import inquirer from 'inquirer';
import Swal from 'sweetalert2'
import session from 'express-session';
import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';
import fs from 'fs';


const app = express();
// convert data into json format
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Initialize multer with the defined storage
const upload = multer({ storage: storage });

// destiny for jpegs

app.use(express.json());

// Static file
app.use(express.static("public"));

app.use('/img', express.static('img'))

// Serve arquivos estáticos do diretório 'uploads'
app.use('/uploads/', express.static('uploads'));

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

app.get("/", (req, res) => {
    res.render("login");
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

app.get("/homeSaibaMais.ejs", (req, res) => {
    res.render("homeSaibaMais");
});
app.get("/sobreNos", (req, res) => {
    res.render("sobreNos");
});

app.get("/contato", (req, res) => {
    res.render("contato");
});

app.get("/servico", (req, res) => {
    res.render("servico");
});

app.get("/ecommerce", async (req, res) => {
    try {
        const items = await ItemCollection.find({}); // Fetch all items
        res.render("ecommerce", { items: items }); // Pass the items to the template
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).send('Error fetching items');
    }
});

app.get('/item/:nome', async (req, res) => {
    const itemName = req.params.nome; // Get the item ID from the URL
    const item = await ItemCollection.findOne({ nome: itemName}); // Fetch the item from the database


    if (item) {
        res.render('itemDetails', { item: item }); // Render the item details page
    } else {
        res.status(404).send('Item not found'); // Send a 404 response if the item is not found
    }
});

app.get('/profile', checkUserLoggedIn, async function (req, res) {
    const pages = await paginas.find({ owner: req.session.user.name }).sort({ createdAt: -1 }).limit(3);
    res.render('profile', {
        name: req.session.user.name,
        cpf: req.session.user.cpf,
        profileImage: req.session.user.profileImage,
        isAdmin: req.session.user.isAdmin,
        pages: pages
    });
});

app.get('/history', checkUserLoggedIn, async function (req, res) {
    const pages = await paginas.find({ owner: req.session.user.name });
    res.render('history', {
        name: req.session.user.name,
        cpf: req.session.user.cpf,
        profileImage: req.session.user.profileImage,
        isAdmin: req.session.user.isAdmin,
        pages: pages
    });
});

app.get('/infos', checkUserLoggedIn, async function (req, res) {
    const pages = await paginas.find({ owner: req.session.user.name });
    res.render('infos', {
        name: req.session.user.name,
        cpf: req.session.user.cpf,
        rf: req.session.user.rf,
        profileImage: req.session.user.profileImage,
        isAdmin: req.session.user.isAdmin,
        pages: pages
    });
});




// Register User
app.post("/signup", async (req, res) => {
    const { rf, name, cpf, password, authenticPassword } = req.body;

    if (password !== authenticPassword) {
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
            return res.status(200).json({ message: 'Usuario criado com sucesso.' });

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

// Logout User

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/login');
        }
        res.clearCookie('sid');
        res.redirect('/login');
    })
});


// Rewrite password
app.post('/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const rf = req.session.user.rf; // Pegar o 'rf' do usuário atualmente logado na sessão

    try {
        // Encontrar o usuário pelo 'rf'
        const user = await collection.findOne({ rf });

        if (!user) {
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        // Verificar se a senha antiga está correta
        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Senha antiga incorreta' });
        }

        // Criptografar a nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar a senha do usuário
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar a senha' });
    }
});



// Login adm
app.post("/adminlogin", async (req, res) => {
    const user = await collection.findOne({ rf: req.body.rf });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        if (user.isAdmin) {
            res.status(200).json({ redirect: '/menu' });
        } else {
            res.status(409).json({ message: 'Este usuario nao possui permissao' });
        }
    } else {
        res.status(401).json({ message: 'Credenciais invalidas' });
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
// index.js

app.post('/createitem', upload.single('image'), async (req, res) => {
    try {
        // Extract form fields
        const { nome, descricao, portas, tipos_de_portas, portas_adicionais, tipos_de_portas_adicionais, protocolos, altura, largura, memoria, processador, MAC, performance, Capacidade_de_encaminhamento, capacidade_de_computacao, Frequência, watts } = req.body;

        // Check if the image was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        // Compress the image using sharp
        const compressedImageBuffer = await sharp(req.file.path)
            .resize(800, 800, { fit: 'inside' }) // Resize the image to fit within 800x800 pixels, maintaining aspect ratio
            .jpeg({ quality: 80 }) // Compress the image to JPEG format with 80% quality
            .toBuffer(); // Convert the processed image back to a Buffer

        // Save the compressed image to the same path to overwrite the original
        await fs.promises.writeFile(req.file.path, compressedImageBuffer);

        // Create a new item with the uploaded image path
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
            watts,
            imagePath: req.file.path // Add the image path to the item
        });

        // Save the new item
        await newItem.save();

        // Send success response
        return res.status(200).json({ message: 'Item criado com sucesso' });
    } catch (err) {
        // Log the error for debugging
        console.error('Error creating item:', err);

        // Send error response
        return res.status(500).json({ message: 'Erro ao criar o item' });
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


// upload da imagem de perfil nova

app.post('/upload', upload.single('profileImage'), async (req, res) => {
    try {
        console.log('Iniciando upload...');
        const user = req.session.user;
        const dbUser = await collection.findOne({ rf: user.rf });
        if (!dbUser) {
            console.log('Usuário não encontrado');
            return res.status(400).send({ error: 'Usuário não encontrado' });
        }
        console.log('Usuário encontrado, atualizando imagem de perfil...');
        dbUser.profileImage = req.file.path;
        await dbUser.save();
        console.log('Imagem de perfil atualizada com sucesso');
        // Atualiza a imagem de perfil na sessão do usuário
        req.session.user.profileImage = dbUser.profileImage;
        res.send({ success: 'Imagem de perfil atualizada com sucesso', imagePath: dbUser.profileImage });
    } catch (err) {
        console.error('Erro ao atualizar a imagem do perfil:', err);
        res.status(500).send({ error: 'Erro ao atualizar a imagem do perfil' });
    }
});



// Pega a imagem de perfil do user

app.get('/getProfileImage', (req, res) => {
    const user = req.session.user; // assumindo que o usuário está na sessão
    res.json({ imagePath: user.profileImage });
});

app.get('/getitemimage/:itemName', async (req, res) => {
    try {
        // Extract the item name from the URL
        const itemName = req.params.itemName;

        // Query the database for the item
        const item = await ItemCollection.findOne({ nome: itemName });

        // Check if the item was found
        if (!item) {
            return res.status(404).send('Item not found');
        }

        // Check if the item has an image path
        if (!item.imagePath) {
            return res.status(404).send('No image associated with this item');
        }

        // Construct the absolute path to the image file
        const imagePath = path.join(__dirname, '..', item.imagePath);

        // Log the constructed path for debugging
        console.log('Attempting to serve image from path:', imagePath);

        // Serve the image
        res.sendFile(imagePath);
    } catch (err) {
        console.error('Error serving item image:', err);
        res.status(500).send('Error serving item image');
    }
});



// Define Port for Application
const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
