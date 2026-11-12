// Page d'inscription.
import { api, getToken, setToken, PAGES } from '../assets/js/api.js';
import { $, showAlert, hideAlert, setBusy } from '../assets/js/ui.js';

// Déjà connecté ? On va directement aux tâches.
if (getToken()) {
    location.replace(PAGES.todos);
}

$('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    hideAlert('registerMessage');

    const body = {
        username: $('regUsername').value.trim(),
        email: $('regEmail').value.trim(),
        password: $('regPassword').value
    };

    setBusy(form, true);
    try {
        const { token } = await api('/api/auth/register', { method: 'POST', body });
        setToken(token);
        location.href = `${PAGES.todos}?welcome=1`;
    } catch (error) {
        showAlert('registerMessage', error.message);
        setBusy(form, false);
    }
});
