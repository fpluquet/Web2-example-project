import express from 'express';
import todoController from '../controllers/todoController.js';
import authMiddleware from '../middleware/auth.js';
import {
  listTodosValidation,
  createTodoValidation,
  updateTodoValidation
} from '../middleware/validation.js';

const router = express.Router();

// Toutes les routes todos nécessitent d'être connecté :
// chaque utilisateur ne voit et ne modifie que ses propres tâches.
router.use(authMiddleware);

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Lister ses tâches
 *     tags: [Todos]
 *     description: Renvoie les tâches de l'utilisateur connecté, de la plus ancienne à la plus récente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: completed
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Ne renvoyer que les tâches terminées (true) ou à faire (false)
 *     responses:
 *       200:
 *         description: Liste des tâches
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoListResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "3f6c1a2e-8f1d-4b7a-9c39-2a4d9e1b7c10"
 *                   userId: "1697462400000"
 *                   title: Acheter du pain
 *                   completed: false
 *                   createdAt: "2026-11-12T09:00:00.000Z"
 *                   updatedAt: "2026-11-12T09:00:00.000Z"
 *       400:
 *         description: Filtre invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Créer une tâche
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTodoRequest'
 *           example:
 *             title: Acheter du pain
 *     responses:
 *       201:
 *         description: Tâche créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoResponse'
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', listTodosValidation, todoController.getTodos);
router.post('/', createTodoValidation, todoController.createTodo);

/**
 * @swagger
 * /api/todos/completed:
 *   delete:
 *     summary: Supprimer toutes ses tâches terminées
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de tâches supprimées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Déclarée avant /:id pour ne pas être capturée comme un identifiant.
router.delete('/completed', todoController.deleteCompletedTodos);

/**
 * @swagger
 * /api/todos/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: Identifiant de la tâche
 *   get:
 *     summary: Obtenir une tâche
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tâche trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoResponse'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tâche introuvable (ou appartenant à un autre utilisateur)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Modifier une tâche
 *     tags: [Todos]
 *     description: Modifie le titre et/ou le statut d'une tâche (au moins un des deux champs)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoRequest'
 *           example:
 *             completed: true
 *     responses:
 *       200:
 *         description: Tâche modifiée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoResponse'
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tâche introuvable (ou appartenant à un autre utilisateur)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Supprimer une tâche
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tâche supprimée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: Tâche supprimée
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tâche introuvable (ou appartenant à un autre utilisateur)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', todoController.getTodo);
router.put('/:id', updateTodoValidation, todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);

export default router;
