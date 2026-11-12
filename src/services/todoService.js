import Todo from '../models/Todo.js';
import todoRepository from '../repositories/TodoRepository.js';

/** Erreur métier avec code HTTP pour le contrôleur. */
export class TodoError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Récupère une todo en vérifiant qu'elle appartient à l'utilisateur.
 * Une todo d'un autre utilisateur est traitée comme introuvable (404)
 * pour ne pas révéler son existence.
 */
const findOwnedTodo = async (userId, todoId) => {
  const todo = await todoRepository.findById(todoId);
  if (!todo || todo.userId !== userId) {
    throw new TodoError('Tâche non trouvée', 404);
  }
  return todo;
};

/**
 * Service todos : orchestre modèle + repository.
 * Le contrôleur ne parle qu'à ce service.
 */
export const getTodos = async (userId, { completed } = {}) => {
  const todos = await todoRepository.findByUser(userId, { completed });
  return todos.map((todo) => todo.toJSON());
};

export const getTodo = async (userId, todoId) => {
  const todo = await findOwnedTodo(userId, todoId);
  return todo.toJSON();
};

export const createTodo = async (userId, { title }) => {
  const todo = new Todo({ userId, title, completed: false });
  await todoRepository.save(todo);
  return todo.toJSON();
};

export const updateTodo = async (userId, todoId, { title, completed }) => {
  const todo = await findOwnedTodo(userId, todoId);

  if (title !== undefined) todo.title = title;
  if (completed !== undefined) todo.completed = completed;
  todo.updatedAt = new Date().toISOString();

  await todoRepository.save(todo);
  return todo.toJSON();
};

export const deleteTodo = async (userId, todoId) => {
  await findOwnedTodo(userId, todoId);
  await todoRepository.deleteById(todoId);
  return { message: 'Tâche supprimée' };
};

export const deleteCompletedTodos = async (userId) => {
  const deleted = await todoRepository.deleteManyByUser(userId, { completed: true });
  return { deleted };
};

export default {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  deleteCompletedTodos
};
