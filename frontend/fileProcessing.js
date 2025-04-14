const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Client } = require("ssh2");
const { rejects } = require("assert");

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
        //req.user.id.toString()
        const uploadDirectory = path.join(__dirname, "uploads");
        fs.mkdir(uploadDirectory, { recursive: true }, (err) => {
            if (err)
                return cb(err);
            cb(null, uploadDirectory);
        });

    },
    filename: (req, file, cb) => {
        //to prevent duplicates from crashing app
        const fileSuffix = Date.now() + "_" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "_" + fileSuffix + path.extname(file.originalname));
    }
});

const uploadFile = multer({
    storage: storageConfig,
    limits: {
        fileSize: 1024 * 1024 * 50 //max 50mb file
    }
})

const upLoadFileToDB = async (req, res, databaseConnection) => {
    if (!req.file)
        return res.status(400).json({ error: "No file uploaded" });

    const user_id = 1;
    const { originalname, filename, path: filePath, size, mimetype } = req.file;

    try {
        const serverPath = await copyFileToServer(filePath, filename);

        const fileData = {
            user_id,
            file_name: originalname,
            file_path: serverPath,
            file_size: size,
            file_type: mimetype
        }
        await uploadTheData(databaseConnection, fileData);
        return res.status(200).json({ message: "Success" });
    } catch (error) {
        console.error(error);
        fs.unlinkSync(filePath);
        return res.status(500).json({ error: "Upload failed" });
    }

}

const uploadTheData = async (databaseConnection, data) => {
    return new Promise((resolve, reject) => {
        const regQuery = `INSERT INTO load_storage.user_files (user_id, file_name, file_path, sile_size, file_type) values(?,?,?,?,?)`;
        databaseConnection.execute(regQuery, [data.user_id, data.file_name, data.file_path, data.file_size, data.file_type], async (error, results) => {
            if (error) {
                reject(error);
            }
            else
                resolve(results);
        });
    });
}

const copyFileToServer = async (localPath, filename) => {
    const clientConnection = new Client();
    const serverDirectory = "mysqlUploads";
    const serverCommunicationConf = {
        host: process.env.DATABASE_HOST,
        username: "bianca",
        password: "bianca",
        port: 22,
        tryKeyboard: true,
    }

    const remotePath = path.join(serverDirectory, filename);

    return new Promise((resolve, reject) => {
        clientConnection.on("ready", () => {
            clientConnection.sftp((error, sftp) => {
                if (error)
                    return reject("SFTP failed: ", error.message);

                sftp.mkdir(serverDirectory, { recursive: true }, (dirErr) => {
                    //4 means already exist, so just ignore it
                    if (dirErr && dirErr.code !== 4) {
                        clientConnection.end();
                        reject(new Error(`dr failed: ${dirErr}`));
                    }

                    sftp.fastPut(localPath, remotePath, (transferError) => {
                        clientConnection.end();
                        if (transferError)
                            reject(transferError);
                        else
                            resolve(remotePath);
                    })
                })
            })
        }).on("error", (error) => {
            reject(new Error(`connection error: ${error.message}`));
        }).connect(serverCommunicationConf);
    });
}

module.exports = {
    upLoadFileToDB,
    uploadFile
}