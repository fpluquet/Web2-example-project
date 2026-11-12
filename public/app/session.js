// Code commun à toutes les pages "connecté" :
// - vérifie qu'un utilisateur est connecté (sinon renvoie vers la connexion)
// - remplit et anime le menu du compte en haut à droite
// - gère la déconnexion et les sessions expirées
import { api, getToken, clearToken, PAGES } from '../assets/js/api.js';
import { $, toast } from '../assets/js/ui.js';

function goToLogin(reason) {
    clearToken();
    location.replace(`${PAGES.login}${reason ? `?reason=${reason}` : ''}`);
}

/**
 * À appeler en premier sur chaque page connectée.
 * Renvoie l'utilisateur connecté, ou redirige vers la connexion.
 * Avec `adminOnly`, un non-admin est renvoyé vers ses tâches.
 */
export async function startSession({ adminOnly = false } = {}) {
    if (!getToken()) {
        goToLogin();
        return new Promise(() => {}); // la page change : on ne continue pas
    }

    let user;
    try {
        user = await api('/api/users/profile', { auth: true });
    } catch (error) {
        if (error.status === 401) {
            goToLogin('expired');
        } else {
            toast(error.message, 'error'); // ex. serveur arrêté
        }
        return new Promise(() => {});
    }

    if (adminOnly && user.role !== 'admin') {
        location.replace(PAGES.todos);
        return new Promise(() => {});
    }

    renderMenuUser(user);
    setupMenu();
    $('appView').hidden = false;
    return user;
}

/** Affiche une erreur API ; si la session a expiré, renvoie vers la connexion. */
export function handleError(error) {
    if (error.status === 401) {
        goToLogin('expired');
    } else {
        toast(error.message, 'error');
    }
}

/** Met à jour le menu (après une modification du profil par exemple). */
export function renderMenuUser(user) {
    $('menuAvatar').textContent = user.username.charAt(0);
    $('menuUsername').textContent = user.username;
    $('menuEmail').textContent = user.email;
    $('menuAdmin').hidden = user.role !== 'admin';
}

// ---------- Menu du compte ----------

function openMenu() {
    $('menuPanel').hidden = false;
    $('menuButton').setAttribute('aria-expanded', 'true');
}

function closeMenu() {
    $('menuPanel').hidden = true;
    $('menuButton').setAttribute('aria-expanded', 'false');
}

function setupMenu() {
    // Met en gras le lien de la page courante.
    for (const link of document.querySelectorAll('.menu-panel a.menu-item')) {
        if (link.getAttribute('href') === location.pathname) {
            link.classList.add('current');
            link.setAttribute('aria-current', 'page');
        }
    }

    $('menuButton').addEventListener('click', (e) => {
        e.stopPropagation();
        if ($('menuPanel').hidden) openMenu(); else closeMenu();
    });

    document.addEventListener('click', (e) => {
        if (!$('userMenu').contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !$('menuPanel').hidden) {
            closeMenu();
            $('menuButton').focus();
        }
    });

    $('logoutBtn').addEventListener('click', () => goToLogin('logout'));
}
