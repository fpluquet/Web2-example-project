// Page "Préférences" : profil et mot de passe.
import { api } from '../assets/js/api.js';
import { $, toast, setBusy, formatDate } from '../assets/js/ui.js';
import { startSession, handleError, renderMenuUser } from './session.js';

let currentUser = await startSession();
renderProfile(currentUser);

function renderProfile(user) {
    $('profileUsername').value = user.username;
    $('profileEmail').value = user.email;
    $('profileCreated').textContent = formatDate(user.createdAt);
    $('profileRole').textContent = user.role === 'admin' ? 'Administrateur' : 'Utilisateur';
}

// ---------- Profil ----------

$('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // On n'envoie que les champs réellement modifiés.
    const username = $('profileUsername').value.trim();
    const email = $('profileEmail').value.trim();
    const body = {};
    if (username !== currentUser.username) body.username = username;
    if (email !== currentUser.email) body.email = email;

    if (!Object.keys(body).length) {
        toast('Aucune modification à enregistrer.');
        return;
    }

    setBusy(form, true);
    try {
        currentUser = await api('/api/users/profile', { method: 'PUT', body, auth: true });
        renderProfile(currentUser);
        renderMenuUser(currentUser);
        toast('Profil mis à jour.');
    } catch (error) {
        handleError(error);
    } finally {
        setBusy(form, false);
    }
});

// ---------- Mot de passe ----------

$('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const body = {
        currentPassword: $('currentPassword').value,
        newPassword: $('newPassword').value,
        confirmPassword: $('confirmPassword').value
    };

    setBusy(form, true);
    try {
        await api('/api/users/change-password', { method: 'PUT', body, auth: true });
        form.reset();
        toast('Mot de passe modifié.');
    } catch (error) {
        handleError(error);
    } finally {
        setBusy(form, false);
    }
});
