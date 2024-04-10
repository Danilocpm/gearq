import express from "express";
import path from "path";
import collection from "./config.js";
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

app.get("/makeadmin", (req, res) => {
    res.render("makeadmin");
});



// Register User
app.post("/signup", async (req, res) => {

    const data = {
        rf: req.body.rf,
        password: req.body.password,
        cpf: req.body.cpf,
    }

    // Check if the username or cpf already exists in the database
    const existingRF = await collection.findOne({$or: [{ rf: data.rf }, { cpf: data.cpf }]});

    if (existingRF) {
        res.status(409).json({message: 'RF or CPF already exists. Please choose a different username or CPF.'});
    } else {
        // Hash the password using bcrypt
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword; // Replace the original password with the hashed one

        const rfdata = await collection.insertMany(data);
        console.log(rfdata);
        res.status(200).json({message: 'User created successfully.'});
    }
});


// Login user 
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ rf: req.body.rf });
        if (!check) {
            return res.send("RF cannot found")
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.send("wrong Password");
        }
        else {
            res.render("home");
        }
    }
    catch {
        res.send("wrong Details");
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


// Promote

app.post("/makeAdmin", async (req, res) => {
    try {
        const user = await collection.findOne({ rf: req.body.rf });
        if (!user) {
            res.send("RF cannot found")
        }
        else {
            user.isAdmin = true;
            await user.save();
            res.send("User is now an admin");
        }
    }
    catch {
        res.send("An error occurred");
    }
}); 



// Define Port for Application
const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});