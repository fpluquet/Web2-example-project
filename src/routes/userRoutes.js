import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { updateProfileValidation, changePasswordValidation, listUsersValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtenir son profil utilisateur
 *     tags: [Utilisateurs]
 *     description: Récupère les informations du profil de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 id: "1697462400000"
 *                 username: johndoe
 *                 email: john@example.com
 *                 role: user
 *                 createdAt: "2023-10-16T12:00:00.000Z"
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Token non fourni"
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Mettre à jour son profil
 *     tags: [Utilisateurs]
 *     description: Met à jour les informations du profil de l'utilisateur connecté (username et/ou email)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             username: johndoe_updated
 *             email: john.updated@example.com
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 id: "1697462400000"
 *                 username: johndoe_updated
 *                 email: john.updated@example.com
 *                 role: user
 *                 createdAt: "2023-10-16T12:00:00.000Z"
 *       400:
 *         description: Erreur de validation ou email/username déjà utilisé
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
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/profile', authMiddleware, updateProfileValidation, userController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Changer son mot de passe
 *     tags: [Utilisateurs]
 *     description: Permet à l'utilisateur connecté de changer son mot de passe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           example:
 *             currentPassword: motdepasse123
 *             newPassword: nouveaumotdepasse456
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               message: "Mot de passe modifié avec succès"
 *       400:
 *         description: Erreur de validation ou mot de passe actuel incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCurrentPassword:
 *                 value:
 *                   success: false
 *                   message: "L'ancien mot de passe est incorrect"
 *               samePassword:
 *                 value:
 *                   success: false
 *                   message: "Le nouveau mot de passe doit être différent de l'ancien"
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/change-password', authMiddleware, changePasswordValidation, userController.changePassword);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtenir la liste des utilisateurs (Admin uniquement)
 *     tags: [Utilisateurs]
 *     description: Récupère la liste paginée de tous les utilisateurs (accessible uniquement aux administrateurs)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de la page à récupérer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'utilisateurs par page (100 au maximum)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [username, email, role, createdAt]
 *           default: createdAt
 *         description: Colonne de tri (username et email triés sans tenir compte de la casse)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sens du tri
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersListResponse'
 *       400:
 *         description: Paramètre invalide (page, limit, sort ou order)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: true
 *               data:
 *                 users:
 *                   - id: "1697462400000"
 *                     username: johndoe
 *                     email: john@example.com
 *                     role: user
 *                     createdAt: "2023-10-16T12:00:00.000Z"
 *                   - id: "1697462500000"
 *                     username: admin
 *                     email: admin@example.com
 *                     role: admin
 *                     createdAt: "2023-10-15T10:00:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   pages: 1
 *                   total: 2
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Accès refusé (nécessite le rôle admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Accès refusé. Rôle admin requis"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authMiddleware, adminMiddleware, listUsersValidation, userController.getUsers);

export default router;