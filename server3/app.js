const express = require('express');
const mysql = require("mysql2");
const { returnDefault, login, registerUser, getSessionInfo } = require("./frontend/functions")
const { loginLayout } = require("./frontend/login");
const { regLayout } = require("./frontend/register");
const { filesLayout } = require("./frontend/files");
const { upLoadFileToDB, uploadFile, downloadFileFromDB, deleteFileFromDB } = require("./frontend/fileProcessing");
const session = require("express-session");
const MySQLStore = require('express-mysql-session')(session);

const path = require("path");
const serverColor = "#c2d7f2";
const port = 3002;
const serverNumber = "3";

require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));
app.use((req,res,next)=>{
    const allowedHost = process.env.SERVERHOST;
    const host = req.headers.host;
    if(host !== allowedHost || req.headers["x-load-balancer"] !== "true"){
        return res.status(403).send("Access denied!  Try using the Nginx Server's address.")
    }
    next();
});

const sessionOptions = {
    host: "192.168.68.101",
    port: "3306",
    user: "session_user",
    password: "password",
    database: "sessions_db",
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabasetable: true
}
const sessionStore = new MySQLStore(sessionOptions);

app.use(session({
    key: "session_name",
    secret: "test",
    resave: false,
    store: sessionStore,
    saveUninitialized: true,
    cookie: { secure: false }
}))

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

app.get("/download/:id", (req, res) => {
    downloadFileFromDB(req, res, databaseConnection)
});

app.delete("/delete/:id", (req, res) => {
    deleteFileFromDB(req, res, databaseConnection)
});

app.get("/test-session", (req, res) => {
    res.send(getSessionInfo(serverColor, serverNumber, req));
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
