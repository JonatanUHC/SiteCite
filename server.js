const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sftpClient = require('ssh2-sftp-client');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname));

const SFTP_CONFIG = {
    host: 'msr6112.minestrator.com',
    port: 2022,
    username: 'sushi12.6510e245',
    password: '3073Mon330Oct-MSR'
};

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
    // Cette route peut servir des données pour l'onglet "Prix"
    const dataPath = path.join(__dirname, 'data', 'minecraft-data.json'); // Ajustez le chemin selon vos besoins
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier de données des prix :', err);
            res.status(500).send('Erreur lors de la lecture des données des prix');
            return;
        }
        res.send(data);
    });
});

app.post('/updateMinecraftData', (req, res) => {
    // Cette route peut être utilisée pour sauvegarder les données de l'onglet "Prix"
    const dataPath = path.join(__dirname, 'data', 'minecraft-data.json'); // Ajustez le chemin selon vos besoins
    fs.writeFile(dataPath, JSON.stringify(req.body, null, 2), async (err) => {
        if (err) {
            console.error('Erreur lors de la mise à jour des données des prix :', err);
            res.status(500).send('Erreur lors de la mise à jour des données des prix');
            return;
        }
        console.log('Données des prix mises à jour avec succès.');
        await uploadToSFTP(dataPath, '/plugins/cite/minecraft-data.json');
        res.sendStatus(200);
    });
});

app.get('/getAllPlayerStats', async (req, res) => {
    // Cette route sert des données pour l'onglet "Stats"
    const sftp = new sftpClient();
    try {
        await sftp.connect(SFTP_CONFIG);
        const fileList = await sftp.list('/world/stats');
        const playerStatsPromises = fileList.map(file => {
            return sftp.get(`/world/stats/${file.name}`);
        });

        const statsFiles = await Promise.all(playerStatsPromises);
        const allStats = statsFiles.map(buffer => JSON.parse(buffer.toString()));
        res.json(allStats);
    } catch (error) {
        console.error('Erreur lors de la récupération des fichiers stats des joueurs via SFTP:', error);
        res.status(500).send('Erreur lors de la récupération des stats des joueurs');
    } finally {
        await sftp.end();
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
