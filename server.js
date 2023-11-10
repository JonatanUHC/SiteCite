require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sftpClient = require('ssh2-sftp-client');
const app = express();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const MySQLStore = require('express-mysql-session')(session);
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
const transporter = nodemailer.createTransport({
    host: 'smtp.elasticemail.com',
    port: 2525, // or 465 if you are using secure: true
    auth: {
        user: 'jonatangaudin@gmail.com',
        pass: '94E20E2A95A38F79294F365A531F9C509463'
    }
});
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
app.get('/reset-password-request', function(req, res) {
    res.sendFile(path.join(__dirname, 'reset-password-request.html'));
});
app.get('/reset-password', function(req, res) {
    res.sendFile(path.join(__dirname, 'reset-password.html'));
});
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(20).toString('hex');

    try {
        const [emailExists] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        if (emailExists.length > 0) {
            return res.status(409).send('E-mail already registered.');
        }

        const [insertResult] = await db.execute('INSERT INTO Users (username, email, password, activation_token) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, activationToken]);

        // Send verification email
        const mailOptions = {
            from: 'info@rebornuhc.fr',
            to: email,
            subject: 'Account Verification',
            html: `<p>Please confirm your email by clicking on the following link: <a href="${process.env.SITE_URL}/activate-account?token=${activationToken}">${process.env.SITE_URL}/activate-account?token=${activationToken}</a></p>`
        };

        await transporter.sendMail(mailOptions);
        res.send('Registration successful! Please check your email to verify your account.');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Error during registration.');
    }
});
app.post('/reset-password-request', async (req, res) => {
    const { email } = req.body;
    const resetToken = crypto.randomBytes(20).toString('hex');

    try {

        await db.execute('UPDATE Users SET reset_token = ? WHERE email = ?', [resetToken, email]);


        const resetUrl = `${process.env.SITE_URL}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: 'info@rebornuhc.fr',
            to: email,
            subject: 'reset mdp',
            html: `<p>Pour réinitialiser votre mot de passe, veuillez cliquer sur ce lien : <a href="${resetUrl}">${resetUrl}</a></p>`
        };

        await transporter.sendMail(mailOptions);
        res.send('Instructions de réinitialisation du mot de passe envoyées par e-mail.');
    } catch (error) {
        console.error('Erreur lors de la demande de réinitialisation :', error);
        res.status(500).send('Erreur lors de la demande de réinitialisation.');
    }
});
app.post('/reset-password', async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Les mots de passe ne correspondent pas.');
    }

    try {
        'SELECT * FROM Users WHERE reset_token = ?',
            [token, new Date()] 

        if (user.length === 0) {
            return res.status(400).send('Token de réinitialisation invalide ou expiré.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('UPDATE Users SET password = ?, reset_token = NULL, WHERE reset_token = ?', [hashedPassword, token]);

        res.send('Mot de passe réinitialisé avec succès.');
    } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe :', error);
        res.status(500).send('Erreur lors de la réinitialisation du mot de passe.');
    }
});
// Login request
app.post('/login', async function(req, res) {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM Users WHERE username = ?', [username]);
        if (rows.length > 0) {
            const comparison = await bcrypt.compare(password, rows[0].password);
            if (comparison) {
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/');
            } else {
                res.send('Mauvais nom et/ou le mot de passe!');
            }
        } else {
            res.send('Mauvais nom et/ou le mot de passe!');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in.');
    }
});
app.get('/activate-account', async (req, res) => {
    const { token } = req.query; // Récupérez le token de la requête

    try {
        // Vérifiez si le token correspond à un utilisateur
        const [users] = await db.execute('SELECT * FROM Users WHERE activation_token = ?', [token]);
        if (users.length === 0) {
            return res.status(404).send('Lien de vérification invalide ou déjà utilisé.');
        }

        // Mettez à jour le statut de l'utilisateur comme vérifié
        const [update] = await db.execute('UPDATE Users SET active = TRUE, activation_token = NULL WHERE activation_token = ?', [token]);
        if (update.affectedRows === 1) {
            // Si la mise à jour a réussi, redirigez l'utilisateur vers une page de confirmation ou la page de connexion
            res.send('Tout est bon');
            res.redirect('/login?verified=true');
        } else {
            res.status(500).send('Erreur lors de la vérification de l\'e-mail.');
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'e-mail :', error);
        res.status(500).send('Erreur serveur interne.');
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