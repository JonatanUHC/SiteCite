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
                // Utilisateur connecté
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('register-section').style.display = 'none';
                document.getElementById('minecraft-container').style.display = 'block';
                document.getElementById('user-info').textContent = 'Vous êtes bien connecté : ' + session.username;
                document.getElementById('user-info').style.display = 'block';
            } else {
                // Utilisateur non connecté
                showLogin();
            }
        })
        .catch(error => console.error('Erreur lors de la récupération de la session', error));
}
if (data.success) {
    // Mettez à jour l'interface utilisateur pour montrer que l'utilisateur est connecté
    updateUIForLoggedInUser(data.username);
    // Redirigez l'utilisateur vers la page d'accueil ou une autre page
    window.location.href = '/';
} else {
    // Affichez le message d'erreur de connexion
    alert(data.message);
}

window.onload = function() {
    initPage();
    checkSessionStatus();
};