const express = require('express');
const mysql = require("mysql2");
const { returnDefault, login, registerUser } = require("./frontend/functions")
const { loginLayout } = require("./frontend/login");
const { regLayout } = require("./frontend/register");
const { filesLayout } = require("./frontend/files");
const { upLoadFileToDB,uploadFile } = require("./frontend/fileProcessing");

const path = require("path");
const serverColor = "#B22222";
const serverNumber = "1";

require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));

const port = 3000;
const databaseConnection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME
});

databaseConnection.connect((error) => {
    if (error) {
        console.log("Not connecting");
        console.error(error);
        process.exit(1);
    }
    else
        console.log("connected successfully");
})

app.get("/", (req, res) => {
    res.send(
        returnDefault(serverColor, serverNumber)
    );
});

app.get("/login", (req, res) => {
    res.send(loginLayout(serverColor));
});

app.post("/login", async (req, res) => {
    login(req, res, databaseConnection);
})

app.get("/files", (req, res) => {
    const query = "SELECT * FROM load_storage.user_files";
    databaseConnection.query(query, async (error, results) => {
        if (error) {
            console.error(error);
            return res.send(filesLayout(serverColor, []));
        }
        res.send(filesLayout(serverColor, results));
    });

});

app.get("/register", (req, res) => {
    res.send(regLayout(serverColor));
});
app.post("/register", async (req, res) => {
    registerUser(req, res, databaseConnection);
})

app.post("/uploadFile", uploadFile.single("fileData"), (req, res) => {
    upLoadFileToDB(req, res, databaseConnection);
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
