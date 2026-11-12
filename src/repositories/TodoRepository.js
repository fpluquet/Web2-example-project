import Todo from '../models/Todo.js';
import db from '../db/database.js';

/**
 * Repository Todo : CRUD uniquement, sur la table SQLite `todos`.
 * Ne contient pas de règles métier (propriété, validation…).
 */

const toTodo = (row) =>
  row
    ? new Todo({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        completed: row.completed === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })
    : null;

class TodoRepository {
  /** Todos d'un utilisateur, de la plus ancienne à la plus récente. Filtre optionnel sur `completed`. */
  // rowid départage les todos créées dans la même milliseconde (ordre d'insertion)
  async findByUser(userId, { completed } = {}) {
    const rows = completed === undefined
      ? db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at, rowid').all(userId)
      : db.prepare('SELECT * FROM todos WHERE user_id = ? AND completed = ? ORDER BY created_at, rowid')
          .all(userId, completed ? 1 : 0);
    return rows.map(toTodo);
  }

  async findById(id) {
    return toTodo(db.prepare('SELECT * FROM todos WHERE id = ?').get(id));
  }

  async save(todo) {
    db.prepare(`
      INSERT INTO todos (id, user_id, title, completed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title      = excluded.title,
        completed  = excluded.completed,
        updated_at = excluded.updated_at
    `).run(
      todo.id,
      todo.userId,
      todo.title,
      todo.completed ? 1 : 0,
      todo.createdAt,
      todo.updatedAt
    );
    return todo;
  }

  async deleteById(id) {
    return db.prepare('DELETE FROM todos WHERE id = ?').run(id).changes > 0;
  }

  /** Supprime les todos d'un utilisateur (filtre optionnel sur `completed`). Renvoie le nombre supprimé. */
  async deleteManyByUser(userId, { completed } = {}) {
    const result = completed === undefined
      ? db.prepare('DELETE FROM todos WHERE user_id = ?').run(userId)
      : db.prepare('DELETE FROM todos WHERE user_id = ? AND completed = ?').run(userId, completed ? 1 : 0);
    return Number(result.changes);
  }
}

export default new TodoRepository();
