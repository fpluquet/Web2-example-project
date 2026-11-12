// Page "Mes tâches" (page d'accueil une fois connecté).
import { api } from '../assets/js/api.js';
import { $, toast, setBusy, plural } from '../assets/js/ui.js';
import { startSession, handleError } from './session.js';

let todos = [];
let filter = 'all';

await startSession();

if (new URLSearchParams(location.search).has('welcome')) {
    toast('Bienvenue ! Votre compte est créé.');
    history.replaceState(null, '', location.pathname);
}

await loadTodos();

// ---------- Chargement et affichage ----------

async function loadTodos() {
    try {
        todos = await api('/api/todos', { auth: true });
        render();
    } catch (error) {
        handleError(error);
    }
}

function render() {
    const visible = todos.filter((t) =>
        filter === 'all' ? true : filter === 'done' ? t.completed : !t.completed
    );

    $('todoList').replaceChildren(...visible.map(renderItem));

    const remaining = todos.filter((t) => !t.completed).length;
    const done = todos.length - remaining;

    $('todoCount').textContent = todos.length === 0
        ? 'Rien de prévu pour l\'instant.'
        : `${remaining} à faire · ${plural(done, 'terminée')}`;

    $('todoEmpty').hidden = visible.length > 0;
    if (todos.length === 0) {
        $('todoEmptyTitle').textContent = 'Aucune tâche';
        $('todoEmptyText').textContent = 'Ajoutez votre première tâche ci-dessus.';
    } else if (filter === 'done') {
        $('todoEmptyTitle').textContent = 'Aucune tâche terminée';
        $('todoEmptyText').textContent = 'Cochez une tâche pour la marquer comme faite.';
    } else {
        $('todoEmptyTitle').textContent = 'Tout est fait';
        $('todoEmptyText').textContent = 'Profitez-en !';
    }

    $('clearCompleted').hidden = done === 0;

    for (const btn of document.querySelectorAll('.segmented .seg')) {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    }
}

function renderItem(todo) {
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

// Renommage en place : Entrée ou clic ailleurs enregistre, Échap annule.
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
            render();
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

// ---------- Actions ----------

async function updateTodo(id, changes) {
    try {
        const updated = await api(`/api/todos/${encodeURIComponent(id)}`, { method: 'PUT', body: changes, auth: true });
        todos = todos.map((t) => (t.id === id ? updated : t));
    } catch (error) {
        handleError(error);
    }
    render();
}

async function deleteTodo(id) {
    try {
        await api(`/api/todos/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
        todos = todos.filter((t) => t.id !== id);
    } catch (error) {
        handleError(error);
    }
    render();
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
        if (filter === 'done') filter = 'all';
        render();
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
        render();
        toast(`${plural(deleted, 'tâche')} supprimée${deleted > 1 ? 's' : ''}.`);
    } catch (error) {
        handleError(error);
    }
});

for (const btn of document.querySelectorAll('.segmented .seg')) {
    btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        render();
    });
}
