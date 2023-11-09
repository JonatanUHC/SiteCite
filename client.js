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

// Appeler initPage au chargement de la page
window.onload = initPage;
