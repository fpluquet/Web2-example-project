import todoService, { TodoError } from '../services/todoService.js';

// Lister ses todos (filtre optionnel ?completed=true|false)
export const getTodos = async (req, res) => {
  try {
    const todos = await todoService.getTodos(req.user.userId, {
      completed: req.query.completed
    });

    res.json({
      success: true,
      data: todos
    });
  } catch (error) {
    if (error instanceof TodoError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la récupération des tâches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir une todo
export const getTodo = async (req, res) => {
  try {
    const todo = await todoService.getTodo(req.user.userId, req.params.id);

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    if (error instanceof TodoError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la récupération de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Créer une todo
export const createTodo = async (req, res) => {
  try {
    const todo = await todoService.createTodo(req.user.userId, req.body);

    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (error) {
    if (error instanceof TodoError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la création de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Modifier une todo (titre et/ou statut)
export const updateTodo = async (req, res) => {
  try {
    const todo = await todoService.updateTodo(req.user.userId, req.params.id, req.body);

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    if (error instanceof TodoError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer une todo
export const deleteTodo = async (req, res) => {
  try {
    const result = await todoService.deleteTodo(req.user.userId, req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof TodoError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la suppression de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer toutes ses todos terminées
export const deleteCompletedTodos = async (req, res) => {
  try {
    const result = await todoService.deleteCompletedTodos(req.user.userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof TodoError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la suppression des tâches terminées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export default {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  deleteCompletedTodos
};
