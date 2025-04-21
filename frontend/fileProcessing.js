const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Client } = require("ssh2");

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
        //req?.user?.user_id.toString()
        const uploadDirectory = path.join(__dirname, "uploads");
        fs.mkdir(uploadDirectory, { recursive: true }, (err) => {
            if (err)
                return cb(err);
            cb(null, uploadDirectory);
        });

    },
    filename: (req, file, cb) => {
        //to prevent duplicates from crashing app
        const newName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileSuffix = Date.now() + "_" + Math.round(Math.random() * 1E9);
        cb(null, newName + "_" + fileSuffix + path.extname(file.originalname));
    }
});

const uploadFile = multer({
    storage: storageConfig,
    limits: {
        fileSize: 1024 * 1024 * 50, //max 50mb file,
        files: 1
    }
})

//store file details in database
const upLoadFileToDB = async (req, res, databaseConnection) => {
    if (!req.file)
        return res.status(400).json({ error: "No file uploaded" });

    const user_id = req?.user?.user_id || 1;
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
        fs.unlinkSync(filePath);

        return res.redirect("/files");
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
        host: process.env.SSH_HOST,
        username: process.env.SSH_USERNAME,
        password: process.env.SSH_PASSWORD,
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

const downloadFileFromDB = async (req, res, dbConnection) => {
    const fileID = req.params.id;

    try {
        const file = await getFileRecord(dbConnection, fileID);
        if (!file) {
            return res.status(404).json({ error: "No file found" });
        }

        const fileFromServer = await getFileFromServer(file.file_path);
        res.setHeader("Content-Type", file.file_type);
        res.setHeader("Content-Disposition", `"attachment; filename="${encodeURIComponent(file.file_name)}"`);
        res.setHeader("Content-Length", file.sile_size);
        fileFromServer.pipe(res);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Download failed" + error.message });
    }
};

const getFileRecord = async (dbConnection, fileId, user_id) => {
    return new Promise((resolve, reject) => {
        const getQuery = `SELECT * FROM load_storage.user_files WHERE file_id = ?`;

        dbConnection.execute(getQuery,
            [fileId],
            (error, results) => {
                if (error)
                    reject(error);
                else
                    resolve(results[0]);
            }
        )
    })
}

const getFileFromServer = (remotePath) => {
    console.log("check server1",remotePath);
    const clientConnection = new Client();
    const serverCommunicationConf = {
        host: process.env.SSH_HOST,
        username: process.env.SSH_USERNAME,
        password: process.env.SSH_PASSWORD,
        port: 22,
        tryKeyboard: true,
    }
    return new Promise((resolve, reject) => {
        clientConnection.on("ready", () => {
            clientConnection.sftp((error, sftp) => {
                if (error) {
                    clientConnection.end();
                    return reject(new Error("stfp failed " + error.message));
                }
                sftp.stat(remotePath, (err, stats) => {
                    if (err) {
                        clientConnection.end();
                        return reject(new Error("File not found"));
                    }
                    const fileStream = sftp.createReadStream(remotePath);
                    fileStream.on("error", (err) => {
                        clientConnection.end();
                        reject(err);
                    });
                    fileStream.on("end", (err) => {
                        clientConnection.end();
                    });
                    resolve(fileStream);
                })

            });
        }).on("error", (error) => {
            reject(new Error("Connection error: " + error.message));
        }).connect(serverCommunicationConf);
    });
};

const deleteFileFromDB = async (req, res, dbConnection) => {
    const fileId = req.params.id;
    const user_id = req?.user?.user_id || 1;
    try {
        const file = await getFileRecord(dbConnection, fileId, user_id);
        if (!file) {
            return res.status(404).json({ error: "No file found" });
        }
        await deleteFileFromServer(file.file_path);
        await deleteFileRecord(dbConnection, fileId, user_id);
        return res.json({ message: "File deleted successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Delete failed" + error.message });
    }
}

const deleteFileRecord = async (dbConnection, fileId, user_id) => {
    return new Promise((resolve, reject) => {
        const deleteQuery = `DELETE FROM load_storage.user_files WHERE file_id = ? AND user_id = ?`;

        dbConnection.execute(
            deleteQuery,
            [fileId, user_id],
            (error, results) => {
                if (error)
                    reject(error);
                else
                    resolve(results);
            }
        )
    })
}

const deleteFileFromServer = async (filePath) => {
    const clientConnection = new Client();
    const serverCommunicationConf = {
        host: process.env.SSH_HOST,
        username: process.env.SSH_USERNAME,
        password: process.env.SSH_PASSWORD,
        port: 22,
        tryKeyboard: true,
    }

    return new Promise((resolve, reject) => {
        clientConnection.on("ready", () => {
            clientConnection.sftp((error, sftp) => {
                if (error) {
                    clientConnection.end();
                    return reject(new Error("stfp failed " + error.message));
                }
                sftp.stat(filePath, (err, stats) => {
                    if (err) {
                        clientConnection.end();
                        return reject(new Error("File not found"));
                    }
                    sftp.unlink(filePath, (unlinkError) => {
                        clientConnection.end();
                        if (unlinkError) {
                            reject(unlinkError);
                        }
                        else
                            resolve();
                    })
                });

            });
        }).on("error", (error) => {
            reject(new Error("Connection error: " + error.message));
        }).connect(serverCommunicationConf);
    });
};
module.exports = {
    upLoadFileToDB,
    uploadFile,
    downloadFileFromDB,
    deleteFileFromDB
}