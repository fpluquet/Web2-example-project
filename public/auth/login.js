// Page de connexion.
import { api, getToken, setToken, PAGES } from '../assets/js/api.js';
import { $, showAlert, hideAlert, setBusy } from '../assets/js/ui.js';

// Déjà connecté ? On va directement aux tâches.
if (getToken()) {
    location.replace(PAGES.todos);
}

// Message transmis par une autre page (?reason=logout|expired).
const reason = new URLSearchParams(location.search).get('reason');
if (reason === 'logout') showAlert('loginMessage', 'Vous êtes déconnecté.', 'info');
if (reason === 'expired') showAlert('loginMessage', 'Votre session a expiré, veuillez vous reconnecter.', 'info');

$('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    hideAlert('loginMessage');

    const email = $('email').value.trim();
    const password = $('password').value;
    if (!email || !password) {
        showAlert('loginMessage', 'Veuillez saisir votre email et votre mot de passe.');
        return;
    }

    setBusy(form, true);
    try {
        const { token } = await api('/api/auth/login', { method: 'POST', body: { email, password } });
        setToken(token);
        location.href = PAGES.todos;
    } catch (error) {
        showAlert('loginMessage', error.message);
        setBusy(form, false);
    }
});
