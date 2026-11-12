// Client du site : connexion, inscription, tâches, préférences, liste admin.
// Le token JWT est conservé dans le localStorage du navigateur.
// Navigation par "hash" : #/todos (accueil), #/preferences, #/admin.

const TOKEN_KEY = 'authToken';
const USERS_PER_PAGE = 10;
const PAGES = ['todos', 'preferences', 'admin'];

const $ = (id) => document.getElementById(id);

let currentUser = null;
let usersPage = 1;
let todos = [];
let todoFilter = 'all';

// =========================================================
// Stockage du token
// =========================================================

function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* stockage indisponible */ }
}

function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* stockage indisponible */ }
}

// =========================================================
// Appels API
// =========================================================

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function api(path, { method = 'GET', body, auth = false } = {}) {
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

// =========================================================
// Petits utilitaires d'affichage
// =========================================================

function showAlert(id, text, type = 'error') {
    const el = $(id);
    el.textContent = text;
    el.className = `alert ${type}`;
    el.hidden = false;
}

function hideAlert(id) {
    $(id).hidden = true;
}

let toastTimer = null;
function toast(text, type = 'success') {
    const el = $('toast');
    el.textContent = text;
    el.className = `toast ${type}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, type === 'error' ? 5000 : 2500);
}

function setBusy(form, busy) {
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

function formatDate(iso) {
    const date = new Date(iso);
    return isNaN(date) ? '—' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Affiche une erreur API. Si le token est refusé (expiré, utilisateur supprimé…),
// on revient à l'écran de connexion.
function handleError(error) {
    if (error.status === 401 && currentUser) {
        logout('Votre session a expiré, veuillez vous reconnecter.');
    } else {
        toast(error.message, 'error');
    }
}

// =========================================================
// Écrans : authentification / application
// =========================================================

function showAuth(panel = 'login') {
    $('appView').hidden = true;
    $('authView').hidden = false;
    $('loginPanel').hidden = panel !== 'login';
    $('registerPanel').hidden = panel !== 'register';
    document.title = panel === 'login' ? 'Connexion · Tâches' : 'Inscription · Tâches';
    (panel === 'login' ? $('email') : $('regUsername')).focus();
}

function showApp() {
    $('authView').hidden = true;
    $('appView').hidden = false;
}

// =========================================================
// Navigation entre les pages de l'application
// =========================================================

function currentPage() {
    const page = location.hash.replace(/^#\/?/, '');
    if (!PAGES.includes(page)) return 'todos';
    if (page === 'admin' && currentUser?.role !== 'admin') return 'todos';
    return page;
}

function renderPage() {
    if (!currentUser) return;
    const page = currentPage();

    for (const name of PAGES) {
        $(`page-${name}`).hidden = name !== page;
    }
    for (const link of document.querySelectorAll('.menu-panel a.menu-item')) {
        link.classList.toggle('current', link.getAttribute('href') === `#/${page}`);
    }
    document.title = { todos: 'Mes tâches', preferences: 'Préférences', admin: 'Utilisateurs' }[page] + ' · Tâches';
    closeMenu();

    if (page === 'admin') {
        usersPage = 1;
        loadUsers();
    }
}

window.addEventListener('hashchange', renderPage);

// =========================================================
// Menu du compte (en haut à droite)
// =========================================================

function openMenu() {
    $('menuPanel').hidden = false;
    $('menuButton').setAttribute('aria-expanded', 'true');
}

function closeMenu() {
    $('menuPanel').hidden = true;
    $('menuButton').setAttribute('aria-expanded', 'false');
}

$('menuButton').addEventListener('click', (e) => {
    e.stopPropagation();
    if ($('menuPanel').hidden) openMenu(); else closeMenu();
});

document.addEventListener('click', (e) => {
    if (!$('userMenu').contains(e.target)) closeMenu();
});

// Ferme aussi le menu quand on clique sur la page déjà affichée (pas de hashchange).
for (const link of document.querySelectorAll('.menu-panel a.menu-item')) {
    link.addEventListener('click', closeMenu);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('menuPanel').hidden) {
        closeMenu();
        $('menuButton').focus();
    }
});

// =========================================================
// Session
// =========================================================

function renderUser(user) {
    currentUser = user;
    $('menuAvatar').textContent = user.username.charAt(0);
    $('menuUsername').textContent = user.username;
    $('menuEmail').textContent = user.email;
    $('menuAdmin').hidden = user.role !== 'admin';

    $('profileUsername').value = user.username;
    $('profileEmail').value = user.email;
    $('profileCreated').textContent = formatDate(user.createdAt);
    $('profileRole').textContent = user.role === 'admin' ? 'Administrateur' : 'Utilisateur';
}

async function startSession() {
    const user = await api('/api/users/profile', { auth: true });
    renderUser(user);
    showApp();
    renderPage();
    await loadTodos();
}

function logout(message) {
    clearToken();
    currentUser = null;
    todos = [];
    todoFilter = 'all';
    closeMenu();
    $('loginForm').reset();
    history.replaceState(null, '', location.pathname);
    showAuth('login');
    if (message) showAlert('loginMessage', message, 'info');
    else hideAlert('loginMessage');
}

$('logoutBtn').addEventListener('click', () => logout('Vous êtes déconnecté.'));

// =========================================================
// Connexion / inscription
// =========================================================

$('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    hideAlert('registerMessage');
    showAuth('register');
});

$('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    hideAlert('loginMessage');
    showAuth('login');
});

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
        form.reset();
        history.replaceState(null, '', '#/todos');
        await startSession();
    } catch (error) {
        showAlert('loginMessage', error.message);
    } finally {
        setBusy(form, false);
    }
});

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
        form.reset();
        history.replaceState(null, '', '#/todos');
        await startSession();
        toast('Bienvenue ! Votre compte est créé.');
    } catch (error) {
        showAlert('registerMessage', error.message);
    } finally {
        setBusy(form, false);
    }
});

// =========================================================
// Tâches
// =========================================================

async function loadTodos() {
    try {
        todos = await api('/api/todos', { auth: true });
        renderTodos();
    } catch (error) {
        handleError(error);
    }
}

function renderTodos() {
    const visible = todos.filter((t) =>
        todoFilter === 'all' ? true : todoFilter === 'done' ? t.completed : !t.completed
    );

    $('todoList').replaceChildren(...visible.map(renderTodoItem));

    const remaining = todos.filter((t) => !t.completed).length;
    const done = todos.length - remaining;

    $('todoCount').textContent = todos.length === 0
        ? 'Rien de prévu pour l\'instant.'
        : `${remaining} à faire · ${done} terminée${done > 1 ? 's' : ''}`;

    $('todoEmpty').hidden = visible.length > 0;
    if (todos.length === 0) {
        $('todoEmptyTitle').textContent = 'Aucune tâche';
        $('todoEmptyText').textContent = 'Ajoutez votre première tâche ci-dessus.';
    } else if (todoFilter === 'done') {
        $('todoEmptyTitle').textContent = 'Aucune tâche terminée';
        $('todoEmptyText').textContent = 'Cochez une tâche pour la marquer comme faite.';
    } else {
        $('todoEmptyTitle').textContent = 'Tout est fait';
        $('todoEmptyText').textContent = 'Profitez-en !';
    }

    $('clearCompleted').hidden = done === 0;

    for (const btn of document.querySelectorAll('.segmented .seg')) {
        btn.classList.toggle('active', btn.dataset.filter === todoFilter);
    }
}

function renderTodoItem(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-check';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `Marquer « ${todo.title} » comme ${todo.completed ? 'à faire' : 'terminée'}`);
    checkbox.addEventListener('change', () => updateTodo(todo.id, { completed: checkbox.checked }));

    const title = document.createElement('span');
    title.className = 'todo-title';
    title.textContent = todo.title;
    title.title = 'Double-cliquez pour renommer';
    title.addEventListener('dblclick', () => startEditing(li, todo));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'todo-delete';
    remove.setAttribute('aria-label', `Supprimer « ${todo.title} »`);
    remove.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    remove.addEventListener('click', () => deleteTodo(todo.id));

    li.append(checkbox, title, remove);
    return li;
}

function startEditing(li, todo) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit';
    input.value = todo.title;
    input.maxLength = 200;

    let finished = false;
    const finish = async (save) => {
        if (finished) return;
        finished = true;
        const value = input.value.trim();
        if (save && value && value !== todo.title) {
            await updateTodo(todo.id, { title: value });
        } else {
            renderTodos();
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        if (e.key === 'Escape') { e.stopPropagation(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));

    li.querySelector('.todo-title').replaceWith(input);
    input.focus();
    input.select();
}

async function updateTodo(id, changes) {
    try {
        const updated = await api(`/api/todos/${encodeURIComponent(id)}`, { method: 'PUT', body: changes, auth: true });
        todos = todos.map((t) => (t.id === id ? updated : t));
    } catch (error) {
        handleError(error);
    }
    renderTodos();
}

async function deleteTodo(id) {
    try {
        await api(`/api/todos/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
        todos = todos.filter((t) => t.id !== id);
    } catch (error) {
        handleError(error);
    }
    renderTodos();
}

$('todoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = $('todoTitle');
    const title = input.value.trim();
    if (!title) {
        input.focus();
        return;
    }

    setBusy(form, true);
    try {
        const todo = await api('/api/todos', { method: 'POST', body: { title }, auth: true });
        todos.push(todo);
        input.value = '';
        if (todoFilter === 'done') todoFilter = 'all';
        renderTodos();
    } catch (error) {
        handleError(error);
    } finally {
        setBusy(form, false);
        input.focus();
    }
});

$('clearCompleted').addEventListener('click', async () => {
    try {
        const { deleted } = await api('/api/todos/completed', { method: 'DELETE', auth: true });
        todos = todos.filter((t) => !t.completed);
        renderTodos();
        toast(`${deleted} tâche${deleted > 1 ? 's' : ''} supprimée${deleted > 1 ? 's' : ''}.`);
    } catch (error) {
        handleError(error);
    }
});

for (const btn of document.querySelectorAll('.segmented .seg')) {
    btn.addEventListener('click', () => {
        todoFilter = btn.dataset.filter;
        renderTodos();
    });
}

// =========================================================
// Préférences
// =========================================================

$('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

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
        const user = await api('/api/users/profile', { method: 'PUT', body, auth: true });
        renderUser(user);
        toast('Profil mis à jour.');
    } catch (error) {
        handleError(error);
    } finally {
        setBusy(form, false);
    }
});

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

// =========================================================
// Utilisateurs (admin)
// =========================================================

async function loadUsers() {
    try {
        const { users, pagination } = await api(
            `/api/users?page=${usersPage}&limit=${USERS_PER_PAGE}`,
            { auth: true }
        );
        $('usersTableBody').replaceChildren(...users.map((u) => {
            const tr = document.createElement('tr');
            const cells = [u.username, u.email, null, formatDate(u.createdAt)];
            cells.forEach((value, i) => {
                const td = document.createElement('td');
                if (i === 2) {
                    const badge = document.createElement('span');
                    badge.className = 'badge';
                    badge.textContent = u.role === 'admin' ? 'Admin' : 'Utilisateur';
                    td.appendChild(badge);
                } else {
                    td.textContent = value;
                }
                tr.appendChild(td);
            });
            return tr;
        }));
        const pages = Math.max(pagination.pages, 1);
        $('pageInfo').textContent = `${pagination.total} utilisateur${pagination.total > 1 ? 's' : ''} · page ${pagination.page} sur ${pages}`;
        $('prevPage').disabled = pagination.page <= 1;
        $('nextPage').disabled = pagination.page >= pages;
    } catch (error) {
        handleError(error);
    }
}

$('prevPage').addEventListener('click', () => {
    if (usersPage > 1) { usersPage--; loadUsers(); }
});

$('nextPage').addEventListener('click', () => {
    usersPage++;
    loadUsers();
});

// =========================================================
// Démarrage : reprendre la session si un token existe
// =========================================================

(async () => {
    if (!getToken()) {
        showAuth('login');
        return;
    }
    try {
        await startSession();
    } catch (error) {
        clearToken();
        currentUser = null;
        showAuth('login');
        if (error.status === 401) {
            showAlert('loginMessage', 'Votre session a expiré, veuillez vous reconnecter.', 'info');
        } else {
            showAlert('loginMessage', error.message);
        }
    }
})();
