const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sftpClient = require('ssh2-sftp-client');
const app = express();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sftpClient = require('ssh2-sftp-client');
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Servir les fichiers statiques depuis le dossier racine
app.use(express.static(__dirname));
// Session configuration
const db = mysql.createPool({
    host: 'sql2.minestrator.com', // Replace with your database host
    user: 'minesr_DqALwf3y', // Replace with your database username
    password: 'mViRxee4yeC5KwjH', // Replace with your database password
    database: 'minesr_DqALwf3y' // Replace with your database name
});
// Configuration du client SFTP à partir des variables d'environnement
// (Assurez-vous de définir ces variables d'environnement en production !)
app.use(session({
    secret: 'siu',
    store: new MySQLStore({}, db),
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static('public'));

// Routes
// Homepage
app.get('/', function(req, res) {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.redirect('/login');
    }
});

// Login page
app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Registration page
app.get('/register', function(req, res) {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Registration request
app.post('/register', async function(req, res) {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering new user.');
    }
});

// Login request
app.post('/login', async function(req, res) {
    const { username, password } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            const comparison = await bcrypt.compare(password, rows[0].password);
            if (comparison) {
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/');
            } else {
                res.send('Incorrect username and/or password!');
            }
        } else {
            res.send('Incorrect username and/or password!');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in.');
    }
});

// Logout request
app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/login');
});
const SFTP_CONFIG = {
    host: 'msr6112.minestrator.com',
    port: 2022, // Utilisez 2022 comme port par défaut si non défini
    username: 'sushi12.6510e245',
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