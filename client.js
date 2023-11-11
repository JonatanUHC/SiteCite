// Fonctions pour afficher les sections de connexion et d'inscription
function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('minecraft-container').style.display = 'none';
}

function showRegister() {
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('minecraft-container').style.display = 'none';
}

// Fonction pour initialiser la page
function initPage() {
    // Vous pourriez vérifier ici si l'utilisateur est déjà connecté
    // et afficher la liste d'objets Minecraft si c'est le cas.
    // Sinon, affichez la section de connexion par défaut.
    showLogin();
}
// client.js
function checkSessionStatus() {
    fetch('/api/session-status')
        .then(response => response.json())
        .then(session => {
            if (session.isLoggedIn) {
                updateUIForLoggedInUser(session.username);
            } else {
                showLogin();
            }
        })
        .catch(error => console.error('Erreur lors de la récupération de la session', error));
}
function updateUIForLoggedInUser(username) {
    document.getElementById('login-link').style.display = 'none';
    document.getElementById('register-link').style.display = 'none';
    document.getElementById('logout-link').style.display = 'block';
    document.getElementById('user-info').textContent = 'Connecté avec le compte : ' + username;
    document.getElementById('user-info').style.display = 'block';
}
window.onload = function() {
    initPage();
    checkSessionStatus();
};