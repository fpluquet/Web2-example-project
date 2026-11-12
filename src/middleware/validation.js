import { body, query, validationResult } from 'express-validator';

// ---------- Middleware de fin de chaîne ----------

// Renvoie 400 avec la liste des erreurs si une règle a échoué, sinon passe au contrôleur
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// ---------- Règles réutilisables ----------

const PASSWORD_MIN = 8;

const usernameRule = () =>
  body('username')
    .isString()
    .withMessage('Le nom d\'utilisateur doit être une chaîne de caractères')
    .bail()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores');

const emailRule = () =>
  body('email')
    .isString()
    .withMessage('L\'email doit être une chaîne de caractères')
    .bail()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail();

const passwordRule = (field, label = 'Le mot de passe') =>
  body(field)
    .isString()
    .withMessage(`${label} doit être une chaîne de caractères`)
    .bail()
    .isLength({ min: PASSWORD_MIN })
    .withMessage(`${label} doit contenir au moins ${PASSWORD_MIN} caractères`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(`${label} doit contenir au moins une minuscule, une majuscule et un chiffre`);

// Chaîne non vide (même message pour "absent", "pas une chaîne" et "vide")
const requiredString = (field, message) =>
  body(field)
    .isString()
    .withMessage(message)
    .bail()
    .notEmpty()
    .withMessage(message);

// Au moins un des champs listés doit être présent dans le body
const atLeastOneOf = (...fields) =>
  body()
    .custom((value) => value && fields.some((f) => value[f] !== undefined))
    .withMessage(`Indiquez au moins un champ à modifier : ${fields.join(' ou ')}`);

// ---------- Auth / utilisateurs ----------

// Validation pour l'inscription
export const registerValidation = [
  usernameRule(),
  emailRule(),
  passwordRule('password'),
  validate
];

// Validation pour la connexion
export const loginValidation = [
  emailRule(),
  requiredString('password', 'Mot de passe requis'),
  validate
];

// Validation pour la mise à jour du profil
export const updateProfileValidation = [
  atLeastOneOf('username', 'email'),
  usernameRule().optional(),
  emailRule().optional(),
  validate
];

// Validation pour le changement de mot de passe
export const changePasswordValidation = [
  requiredString('currentPassword', 'L\'ancien mot de passe est requis'),

  passwordRule('newPassword', 'Le nouveau mot de passe')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('Le nouveau mot de passe doit être différent de l\'ancien'),

  requiredString('confirmPassword', 'La confirmation du mot de passe est requise')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('La confirmation du mot de passe ne correspond pas'),

  validate
];

// Validation pour la liste des utilisateurs (admin)
export const USER_SORT_FIELDS = ['username', 'email', 'role', 'createdAt'];

export const USERS_MAX_LIMIT = 100;

export const listUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier supérieur ou égal à 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: USERS_MAX_LIMIT })
    .withMessage(`La limite doit être un entier entre 1 et ${USERS_MAX_LIMIT}`)
    .toInt(),

  query('sort')
    .optional()
    .isIn(USER_SORT_FIELDS)
    .withMessage(`Le tri doit porter sur : ${USER_SORT_FIELDS.join(', ')}`),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('L\'ordre doit valoir asc ou desc'),

  validate
];

// ---------- Todos ----------

const TODO_TITLE_MAX = 200;

const todoTitle = () =>
  body('title')
    .isString()
    .withMessage('Le titre doit être une chaîne de caractères')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis')
    .isLength({ max: TODO_TITLE_MAX })
    .withMessage(`Le titre ne peut pas dépasser ${TODO_TITLE_MAX} caractères`);

// Validation pour le filtre de la liste des todos
export const listTodosValidation = [
  query('completed')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Le filtre completed doit valoir true ou false')
    .toBoolean(true),
  validate
];

// Validation pour la création d'une todo
export const createTodoValidation = [todoTitle(), validate];

// Validation pour la mise à jour d'une todo
export const updateTodoValidation = [
  atLeastOneOf('title', 'completed'),

  todoTitle().optional(),

  body('completed')
    .optional()
    .custom((value) => typeof value === 'boolean')
    .withMessage('Le champ completed doit être un booléen (true ou false)'),

  validate
];
