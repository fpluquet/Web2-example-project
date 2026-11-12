// Accès à l'API et gestion du token JWT (partagé par toutes les pages).
// Le token est conservé dans le localStorage du navigateur.

const TOKEN_KEY = 'authToken';

// ---------- Token ----------

export function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* stockage indisponible */ }
}

export function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* stockage indisponible */ }
}

// ---------- Appels API ----------

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

/**
 * Appelle l'API et renvoie le champ `data` de la réponse.
 * Lève une ApiError (avec le code HTTP) en cas d'échec.
 */
export async function api(path, { method = 'GET', body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new ApiError('Impossible de contacter le serveur.', 0);
    }

    let payload = null;
    try { payload = await response.json(); } catch { /* réponse non JSON */ }

    if (!response.ok || (payload && payload.success === false)) {
        throw new ApiError(extractErrorMessage(payload, response.status), response.status);
    }
    return payload ? payload.data ?? payload : null;
}

function extractErrorMessage(payload, status) {
    if (payload) {
        // Erreurs express-validator : [{ msg, path, ... }]
        if (Array.isArray(payload.errors) && payload.errors.length) {
            return [...new Set(payload.errors.map((e) => e.msg))].join('\n');
        }
        if (payload.message) return payload.message;
    }
    if (status === 429) return 'Trop de requêtes, réessayez dans quelques minutes.';
    return `Erreur inattendue (code ${status}).`;
}

// ---------- Adresses des pages ----------

export const PAGES = {
    login: '/auth/login.html',
    register: '/auth/register.html',
    todos: '/app/todos.html',
    preferences: '/app/preferences.html',
    admin: '/app/admin.html'
};
