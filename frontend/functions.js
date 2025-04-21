const bcrypt = require("bcrypt");
const hashVal = 10;

const login = async (req, res, databaseConnection) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).send("Email and pass are required");
        const user = await loginFunction({ email, password }, databaseConnection);

        console.log(user);
        req.session.user = user;
        req.session.save(err => {
            if (err) {
                console.error("Couldnt save session");
                return res.status(500).send("Interal error");
            }
            res.redirect("/files");
        })


    } catch (error) {
        console.error("login err", error);
        res.status(401).send(`
            <html>
            <body>
            <h1> Invalid credentials</h1>
            <p> ${error.message}</p>
            </body>
            </html>`)
    }
}

const loginFunction = async (credentials, databaseConnection) => {
    return new Promise((resolve, reject) => {
        const authQuery = `SELECT * FROM load_storage.users WHERE user_email = ?`;

        databaseConnection.query(authQuery, [credentials.email], async (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            if (results.length === 0) {
                reject(new Error("Invalid credentials"));
                return;
            }
            const user = results[0];
            const passMatch = await bcrypt.compare(credentials.password, user.user_pass);

            if (!passMatch) {
                reject(new Error("Invalid credentials"));
                return;
            }
            delete user.user_pass;
            resolve(user);
        });
    });
}

const registerUser = async (req, res, databaseConnection) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password)
            return res.status(400).send("All fields are required");
        const hashedPass = await bcrypt.hash(password, hashVal);
        await register({ fullName, email, hashedPass }, databaseConnection);
        res.redirect("/login");

    } catch (error) {
        console.error("Register err", error);
        res.status(401).send(`
            <html>
            <body>
            <h1> Registration failed</h1>
            <p> ${error.message}</p>
            </body>
            </html>`)
    }
}

const register = async (data, dbCon) => {
    return new Promise((resolve, reject) => {
        const regQuery = `INSERT INTO load_storage.users (user_email, user_pass, full_name) values(?,?,?)`;
        dbCon.execute(regQuery, [data.email, data.hashedPass, data.fullName], async (error, results) => {
            if (error) {
                reject(error);
            }
            else
                resolve(results);
        });
    });
}

const returnDefault = (bgColor, serverNumber) => {
    return (
        `
        <html>
            <body style="background-color: ${bgColor};">
                <h1>
                Hello Welcome to Server ${serverNumber}
                </h1>
                <a href="/login">login</a>
            </body>
        </html>
    `
    );
}

module.exports = {
    returnDefault,
    loginFunction,
    login,
    registerUser
}