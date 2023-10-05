const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sftpClient = require('ssh2-sftp-client');
const app = express();

// Utilisez le port fourni par Vercel ou, par défaut, le port 3000 en local
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Servir les fichiers statiques depuis le dossier racine
app.use(express.static(__dirname));

// Configuration du client SFTP à partir des variables d'environnement
// (Assurez-vous de définir ces variables d'environnement en production !)
const SFTP_CONFIG = {
    host: 'msr1001.minestrator.com',
    port: 2022, // Utilisez 2022 comme port par défaut si non défini
    username: 'sushi12.ec21c710',
    password: '3073Mon330Oct-MSR'
};

// Fonction pour envoyer un fichier local vers le serveur SFTP
async function uploadToSFTP(localPath, remotePath) {
    const sftp = new sftpClient();
    try {
        await sftp.connect(SFTP_CONFIG);
        await sftp.put(localPath, remotePath);
    } catch (error) {
        console.error('Erreur lors de l\'upload vers SFTP:', error);
    } finally {
        await sftp.end();
    }
}

app.get('/getMinecraftData', (req, res) => {
    fs.readFile('minecraft-data.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier JSON :', err);
            res.status(500).send('Erreur lors de la lecture du fichier JSON');
            return;
        }
        res.send(data);
    });
});

app.post('/updateMinecraftData', (req, res) => {
    const minecraftData = req.body;
    fs.writeFile('minecraft-data.json', JSON.stringify(minecraftData, null, 2), async (err) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du fichier JSON :', err);
            res.status(500).send('Erreur lors de la mise à jour du fichier JSON');
            return;
        }
        console.log('Fichier JSON mis à jour avec succès.');
        await uploadToSFTP('minecraft-data.json', '/plugins/cite/minecraft-data.json');
        res.sendStatus(200);
    });
});

// Route catch-all pour gérer toutes les autres requêtes et renvoyer l'index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
