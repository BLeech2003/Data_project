const express = require('express');
const mysql = require("mysql2");
const { returnDefault, login } = require("./frontend/functions")
const { loginLayout } = require("./frontend/login");
const path = require("path");
const serverColor = "gold";

require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const port = 3001;
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
        returnDefault(serverColor,'3')
    );
});

app.get("/login", (req, res) => {
    res.send(loginLayout(serverColor));
});

app.post("/login", async (req, res) => {
    login(req, res, databaseConnection);
})

app.get("/files", (req, res) => {
    res.send("files");
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
