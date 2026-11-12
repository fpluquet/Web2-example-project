// Page "Utilisateurs" : réservée aux administrateurs.
import { api } from '../assets/js/api.js';
import { $, formatDate, plural } from '../assets/js/ui.js';
import { startSession, handleError } from './session.js';

const USERS_PER_PAGE = 10;
// Sens appliqué au premier clic sur une colonne (dates : plus récent d'abord)
const DEFAULT_ORDER = { username: 'asc', email: 'asc', role: 'asc', createdAt: 'desc' };

let page = 1;
let sort = 'createdAt';
let order = 'desc';
let requestId = 0;

await startSession({ adminOnly: true });
await loadUsers();

async function loadUsers() {
    // Ignore les réponses d'une requête dépassée (clics rapides sur les en-têtes)
    const current = ++requestId;
    try {
        const params = new URLSearchParams({ page, limit: USERS_PER_PAGE, sort, order });
        const { users, pagination } = await api(`/api/users?${params}`, { auth: true });
        if (current !== requestId) return;

        $('usersTableBody').replaceChildren(...users.map(renderRow));

        const pages = Math.max(pagination.pages, 1);
        $('pageInfo').textContent = `${plural(pagination.total, 'utilisateur')} · page ${pagination.page} sur ${pages}`;
        $('prevPage').disabled = pagination.page <= 1;
        $('nextPage').disabled = pagination.page >= pages;
    } catch (error) {
        handleError(error);
    }
}

function renderRow(user) {
    const tr = document.createElement('tr');

    const cell = (content) => {
        const td = document.createElement('td');
        if (content instanceof Node) td.appendChild(content);
        else td.textContent = content;
        tr.appendChild(td);
    };

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = user.role === 'admin' ? 'Admin' : 'Utilisateur';

    cell(user.username);
    cell(user.email);
    cell(badge);
    cell(formatDate(user.createdAt));
    return tr;
}

function updateSortHeaders() {
    for (const button of document.querySelectorAll('.th-sort')) {
        const active = button.dataset.sort === sort;
        button.closest('th').setAttribute(
            'aria-sort',
            active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'
        );
    }
}

// Même colonne : inverse le sens. Autre colonne : sens par défaut de cette colonne.
for (const button of document.querySelectorAll('.th-sort')) {
    button.addEventListener('click', () => {
        const column = button.dataset.sort;
        if (column === sort) {
            order = order === 'asc' ? 'desc' : 'asc';
        } else {
            sort = column;
            order = DEFAULT_ORDER[column];
        }
        page = 1;
        updateSortHeaders();
        loadUsers();
    });
}

$('prevPage').addEventListener('click', () => {
    if (page > 1) { page--; loadUsers(); }
});

$('nextPage').addEventListener('click', () => {
    page++;
    loadUsers();
});
