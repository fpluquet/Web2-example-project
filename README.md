# API RESTful avec Node.js et Express

Exemple complet d'API RESTful (gestion de comptes et de todos) construite avec Node.js, Express et SQLite.

## Fonctionnalités

- **Authentification JWT** : inscription et connexion sécurisées (token valable 24 h)
- **Gestion des utilisateurs** : profil, changement de mot de passe, rôles `user` / `admin`
- **Todos** : chaque utilisateur gère ses propres tâches (création, modification, filtre, suppression)
- **Base de données SQLite** : module `node:sqlite` intégré à Node, aucune dépendance native à installer
- **Validation des données** : côté serveur avec express-validator
- **Sécurité** : Helmet, CORS, limitation du taux de requêtes (100 requêtes / 15 min par IP), mots de passe hashés (bcrypt)
- **Documentation Swagger** : documentation interactive de l'API
- **Front-end** : pages HTML statiques servies depuis `public/`
- **Tests** : Jest et Supertest, sur une base en mémoire
- **Structure modulaire** : Routes → Controllers → Services → Models / Repositories

## Prérequis

- **Node.js >= 22.13** (pour le module `node:sqlite`)

## Installation

1. Cloner le projet
2. Installer les dépendances :

```bash
npm install
```

3. Créer un fichier `.env` basé sur `.env.example`
4. (Optionnel) Remplir la base avec des données de démo, voir [Base de données](#base-de-données)
5. Lancer l'application :

```bash
# Mode développement (rechargement automatique avec nodemon)
npm run dev

# Mode production
npm start
```

L'application est disponible sur `http://localhost:3000` (port modifiable via `PORT`).

### Variables d'environnement

| Variable      | Rôle                                      | Défaut                       |
|---------------|-------------------------------------------|------------------------------|
| `PORT`        | Port HTTP                                 | `3000`                       |
| `JWT_SECRET`  | Clé de signature des tokens JWT           | **obligatoire** : l'app refuse de démarrer sans |
| `DB_PATH`     | Chemin du fichier SQLite                  | `src/data/app.prod.sqlite`   |
| `ENVIRONMENT` | `test` = base SQLite en mémoire           | positionnée par `npm test`   |

## Base de données

La base est un fichier SQLite : `src/data/app.prod.sqlite`, ou le chemin donné par `DB_PATH`. Le schéma (tables `users` et `todos`) est créé automatiquement au démarrage s'il n'existe pas. La suppression d'un utilisateur supprime aussi ses todos.

### Seed

> ⚠️ Le seed **vide toute la base** avant d'insérer les données.

```bash
npm run seed   # compte admin + 100 utilisateurs générés, avec leurs todos
```

Compte administrateur : `admin@example.com` / `Admin1234`.

Le seed crée aussi **100 utilisateurs** (`user` uniquement) aux noms générés, par exemple `lucas.martin001@example.com`, tous avec le mot de passe `Password123`. Leurs inscriptions sont étalées sur les 100 derniers jours et chacun a de 0 à 5 todos. Les données sont identiques à chaque exécution.

Si une insertion échoue (doublon, todo sans utilisateur…), le seed est annulé et la base reste inchangée.

> Node affiche `ExperimentalWarning: SQLite is an experimental feature` au démarrage : c'est normal.

## Documentation Swagger

Une fois le serveur démarré, accédez à la documentation interactive de l'API :

```
http://localhost:3000/api-docs
```

Elle permet de visualiser les endpoints, de consulter les schémas de requêtes et réponses, et de tester les appels directement depuis le navigateur (bouton **Authorize** pour y coller le token JWT).

## API Endpoints

Les routes marquées 🔒 nécessitent l'en-tête `Authorization: Bearer <token>` (token renvoyé par l'inscription ou la connexion).

### Authentification
- `POST /api/auth/register` : inscription
- `POST /api/auth/login` : connexion

### Utilisateurs
- `GET /api/users/profile` 🔒 : profil de l'utilisateur connecté
- `PUT /api/users/profile` 🔒 : modifier son nom d'utilisateur et/ou son email
- `PUT /api/users/change-password` 🔒 : changer son mot de passe
- `GET /api/users?page=1&limit=10&sort=createdAt&order=desc` 🔒 : liste paginée et triée des utilisateurs (**admin**) ; `page` >= 1, `limit` entre 1 et 100, `sort` = `username`, `email`, `role` ou `createdAt`, `order` = `asc` ou `desc`

### Todos
Un utilisateur ne voit et ne modifie que ses propres todos.

- `GET /api/todos?completed=true|false` 🔒 : lister ses todos (filtre optionnel)
- `POST /api/todos` 🔒 : créer une todo
- `GET /api/todos/:id` 🔒 : obtenir une todo
- `PUT /api/todos/:id` 🔒 : modifier le titre et/ou le statut `completed`
- `DELETE /api/todos/:id` 🔒 : supprimer une todo
- `DELETE /api/todos/completed` 🔒 : supprimer toutes ses todos terminées

### Règles de validation

| Champ             | Règle                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| `username`        | au moins 3 caractères ; lettres, chiffres et `_` uniquement ; unique           |
| `email`           | adresse email valide ; unique                                                  |
| `password`        | au moins 8 caractères, avec une minuscule, une majuscule et un chiffre         |
| `newPassword`     | mêmes règles, et différent du mot de passe actuel                              |
| `confirmPassword` | identique à `newPassword`                                                      |
| `title` (todo)    | chaîne non vide, 200 caractères maximum                                        |
| `completed`       | booléen (`true` / `false`)                                                     |

En cas d'erreur de validation, l'API répond `400` avec `{ "success": false, "errors": [...] }`.

## Tests

```bash
npm test
```

Les tests utilisent une base SQLite en mémoire, vidée après chaque test : la base `src/data/app.prod.sqlite` n'est jamais touchée. Voir [tests/README.md](tests/README.md).

## Structure du projet

```
src/
├── config/          # Configuration (Swagger)
├── controllers/     # Orchestration HTTP (appelle les services)
├── data/            # Fichier SQLite (app.prod.sqlite), créé au premier lancement
├── db/              # Connexion + schéma SQLite (database.js), seed (seed.js)
├── middleware/      # Auth JWT, admin, validation, gestion d'erreurs
├── models/          # Entités métier (indépendantes du stockage)
├── repositories/    # Accès aux données (requêtes SQL)
├── services/        # Règles métier (orchestre models + repositories)
├── routes/          # Définition des routes + annotations Swagger
└── app.js           # Point d'entrée

public/              # Front-end statique (pages auth et application)
tests/               # Tests Jest + Supertest
```
