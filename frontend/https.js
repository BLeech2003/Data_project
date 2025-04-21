const fs = require("fs");
const https = require("https");


module.exports = (app) => {
    const options = {
        key: fs.readFileSync(""),
        cert: fs.readFileSync(""),
    };
    return https.createServer(options, app)
}