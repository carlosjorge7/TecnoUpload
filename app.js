if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// settings
app.set('port', process.env.PORT || 3000);


// middlewares , funciones que se ejecutan antes de las routes
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false})); // para recibir data de un formulario
app.use(express.static(path.join(__dirname, 'public')));

// multer
const multer = require('multer');
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage}).single('file');

// config
const config = require('./config');

// azure
const azureStorage = require('azure-storage');
const blobService = azureStorage.createBlobService();
const containerName = 'files';

const getStream = require('into-stream');
//const e = require('express');

const getBlobName = originalName => {
    const identifier = Math.random().toString().replace(/0\./, '');
    return `${identifier}-${originalName}`;
}

// sendgrid
const sendGrid = require('@sendgrid/mail');
const { measureMemory } = require('vm');
const KEY = process.env.SENDGRID_APIKEY;

sendGrid.setApiKey(KEY);

function send(email) {
    const message = {
        to: 'carlos.jorge@tecnofun.es',
        from: 'noreply@tecnofun.es',
        subject: 'Success uploading to Cloud Azure',
        text: `Se ha subido un archivo al contenedor files`,
        html: '<h3>Hola Jacin, un cliente ha subido un archivo al contenedor files</h3>'
    }

    sendGrid.send(message)
            .then((res) => console.log('El email se ha enviado'))
                .catch((error) => console.log(error.message))
}

// Rutas
app.post('/upload', uploadStrategy, (req, res) => {
    // nombre del archivo a subir
    const blobName = getBlobName(req.file.originalname);
    // obtenemos el stream del archivo
    const stream = getStream(req.file.buffer);
    // obtenemos la longitud de ese stream
    const streamLength = req.file.buffer.length;

    blobService.createBlockBlobFromStream(containerName, blobName, stream, streamLength, err => {
        if(err){
            console.log(err);
            return;
        }
        res.status(200).send('Archivo subido exitosamente');
        // Enviamos mail
        send(email);
    });
});

// starting the server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});


module.exports = app;
