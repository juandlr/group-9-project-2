const express = require("express");
const fileUpload = require('express-fileupload');
const fs = require('fs');
const http = require("http");
const app = express();
// app.use(express.json({limit: '5mb'}));
const port_local = 8080;

// default options
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Imports the Google Cloud client library
const {Storage} = require('@google-cloud/storage');

// For more information on ways to initialize Storage, please see
// https://googleapis.dev/nodejs/storage/latest/Storage.html

// Creates a client from a Google service account key
const storage = new Storage({keyFilename: 'plexiform-skill-375414-d975912ff374.json'});

// The ID of your GCS bucket
const bucketName = 'group9-project-2';

// Display Form
app.get('/', (req, res) => {
    let files_html = '';

    async function listFiles() {
        // Lists files in the bucket
        const [files] = await storage.bucket(bucketName).getFiles();

        console.log('Files:');
        files.forEach(file => {
            let file_url = "images/" + file.name;
            files_html += `<a href='${file_url}'>${file.name}</a><br />`;
            console.log(file.name);
        });

        try {
            // console.log(rawData);
            let formHTML = `
<form action="/upload" method="POST" enctype="multipart/form-data">
    <input type="file" name="image">
    <button type="submit">Upload</button>
</form>${files_html}`;
            res.send(formHTML);
        } catch (e) {
            console.error(e.message);
        }
    }

    listFiles().catch(console.error);
});

app.get("/images/*", (req, res) => {
    let paramImage = req.params[0];
    const file = storage.bucket(bucketName).file(paramImage);
    let readStream = file.createReadStream();
    let chunks = [];
    readStream.on('data', (chunk) => {
        chunks.push(chunk);
    });

    readStream.on('end', () => {
        try {
            let img_buffer = Buffer.concat(chunks);
            let data = img_buffer.toString("base64");
            let str_html = `<img style="max-width: 500px" src="data:image/jpeg;base64,${data}" />`;
            str_html += "<br /><input style='margin-top: 10px;' type=\"button\" value=\"Go Back\" onclick=\"history.go(-1)\">";
            res.send(str_html);
        } catch (e) {
            console.error(e.message);
        }
    });

});

// upload files
app.post("/upload", (req, res) => {
    const postData = JSON.stringify(req.files);
    const filePath = req.files.image.tempFilePath;

    async function uploadFile() {
        const options = {
            destination: req.files.image.name,
        };

        await storage.bucket(bucketName).upload(filePath, options);
        console.log(`${filePath} uploaded to ${bucketName}`);
        res.redirect('/');
    }

    uploadFile().catch(console.error);

});

const port = parseInt(process.env.PORT) || port_local;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});