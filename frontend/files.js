const filesLayout = (bgColor, files = []) => {
    return (`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Manager</title>
            <style>
                body{
                background-color:${bgColor};
                margin:0;
                padding: 0;
            }
            .container {
                max-width: 1000px;
                background-color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                margin: 2rem auto;
            }
            h1{
                text-align: center;
                color: #333;
                margin-bottom: 1.5rem;
            }
            .uploadbutton {
                padding: 0.75rem 1.5rem;
                background-color: gold;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
                margin-bottom: 1rem;
            }
            table {
                width:100%;
                border-collapse:collapse;
                margin-top:1rem;
            }
            th, td {
                padding: 0.75rem;
                text-align:left;
                border-bottom:1px solid #ddd;
            }
            th {
                background-color:rgb(202, 184, 184);
                color: #333;    
            }

            .deleteButton {
                padding: 0.5rem 1.5rem;
                background-color: red;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .downloadButton {
                padding: 0.5rem 1.5rem;
                background-color: gold;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .modal{
                display:none;
                position:fixed;
                z-index:1;
                left:0;
                top:0;
                width:100%;
                height:100%;
                background-color: rgba(0,0,0,0.4);
            }
            .modal-content {
                background-color: white;
                margin: 15% auto;
                padding:2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                width:80%;
                max-width:500px;
            }
            .closeButton {
                color: #aaa;
                float: right;
                font-size: 1.5 rem;
                font-weight: bold;
                cursor:pointer;
            }   
            .form-group {
                margin-bottom: 1rem;
            }

            label {
                display: block;
                margin-bottom: 0.5rem;
                color:#333;
            }
            input[type=file] {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            .submitButton {
                padding: 0.75rem;
                background-color: gold;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
                margin-top: 1rem;
                width:100%;
            }
            </style>

        </head>

        <body>
            <div class="container">
                <h1>Files</h1>
                <button id="openUpload" class="uploadbutton"> Upload file</button>
                <table id="fileTable">
                    <thead>
                        <tr>
                            <th> File name </th>
                            <th> Size </th>
                            <th> Upload Date </th>
                            <th> Nr of downloads </th>
                            <th> Actions </th>
                        </tr>
                    </thead>

                    <tbody>
                    ${files.length === 0 ?
            `<tr>
                            <td colspan="5" style="text-align: center;"> No files found</td>
                        </tr>` :
            files.map(file => `
                        <tr key=${file.file_id}>
                            <td>${file.file_name} </td>
                            <td>${formatFileSize(file.sile_size)} </td>
                            <td>${new Date(file.upload_date).toLocaleString()} </td>
                            <td>${file.download_count} </td>
                            <td>
                                <a class="downloadButton" href="/download/${file.file_id}"> 
                                    Download
                                </a>
                                <button class="deleteButton" onclick="deleteFile('${file.file_id}')"> 
                                    Delete
                                </button>
                            </td>
                        </tr> 
                    `).join("")
        }
                    </tbody >
                </table >
            </div >

    <div id="uploadModal" class="modal">
        <div class="modal-content">
            <span class="closeButton"> &times;</span>
            <h2> Upload a file</h2>
                <form id="uploadForm" enctype="multipart/form-data" method="POST" action="/uploadFile">
                    <div class="form-container">
                        <label for="fileData">
                            Select file
                        </label>
                        <input type="file" id="fileData" name="fileData" required>
                    </div>
                    <button type="submit" class="submitButton">Upload</button>
                </form>
            </div>
        </div>
        <script>
            const modal = document.getElementById("uploadModal");
            const openButton = document.getElementById("openUpload");
            const closeButton = document.querySelector(".closeButton");

            openButton.onclick = function () {document.getElementById("uploadModal").style.display = "block"; }
            closeButton.onclick = function () {
                document.getElementById("uploadModal").style.display = "none";
            document.getElementById("uploadForm").reset();
                }

            window.onclick = function (event) {
                    if (event.target == modal) {
                document.getElementById("uploadModal").style.display = "none";
            document.getElementById("uploadForm").reset();
                    }
                }

                async function deleteFile(fileId){
                    if(confirm("Are you sure you want to delete this file?")){
                        try{
                        console.log("next step");
                            const response = await fetch(\`/delete/\${fileId}\`,{
                                method: "DELETE"
                            });
                            if(response.ok)
                                window.location.reload();
                            else{
                                const err = await response.json();
                                alert(error);
                            }

                        }catch(error){
                            console.error(error);
                            alert("Failed to delete file");
                        }
                    }    
                }
        </script>
    </body>
        </html >
    `);
}


const formatFileSize = (file) => {
    const size = file > 1024 * 1024 ?
        `${(file / (1024 * 1024)).toFixed(2)} MB` :
        `${Math.round(file / 1024)} KB`;

    return size;
}


module.exports = {
    filesLayout,
}