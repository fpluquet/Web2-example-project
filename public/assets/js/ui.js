// Petits utilitaires d'affichage partagés par toutes les pages.

export const $ = (id) => document.getElementById(id);

/** Affiche un message dans un encadré `.alert` (pages de connexion). */
export function showAlert(id, text, type = 'error') {
    const el = $(id);
    el.textContent = text;
    el.className = `alert ${type}`;
    el.hidden = false;
}

export function hideAlert(id) {
    $(id).hidden = true;
}

/** Affiche une notification temporaire en bas de l'écran. */
let toastTimer = null;
export function toast(text, type = 'success') {
    let el = $('toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        document.body.appendChild(el);
    }
    el.textContent = text;
    el.className = `toast ${type}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, type === 'error' ? 5000 : 2500);
}

/** Désactive le bouton d'envoi d'un formulaire pendant une requête. */
export function setBusy(form, busy) {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (busy) {
        button.dataset.label = button.textContent;
        button.textContent = 'Patientez…';
    } else if (button.dataset.label) {
        button.textContent = button.dataset.label;
    }
    button.disabled = busy;
}

export function formatDate(iso) {
    const date = new Date(iso);
    return isNaN(date) ? '—' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
