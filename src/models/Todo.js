import { randomUUID } from 'crypto';

/**
 * Modèle Todo : une tâche appartenant à un utilisateur.
 * Indépendant du stockage : n'importe ni repository ni service.
 */
class Todo {
  constructor(todoData) {
    const now = new Date().toISOString();
    this.id = todoData.id || randomUUID();
    this.userId = todoData.userId;
    this.title = todoData.title;
    this.completed = Boolean(todoData.completed);
    this.createdAt = todoData.createdAt || now;
    this.updatedAt = todoData.updatedAt || this.createdAt;
  }

  /** Sérialisation API / stockage. */
  toJSON() {
    return { ...this };
  }
}

export default Todo;
