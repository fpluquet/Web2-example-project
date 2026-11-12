import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Connexion SQLite unique (module node:sqlite intégré à Node >= 22.13, API synchrone).
 *
 * Fichier utilisé :
 *   - DB_PATH s'il est défini dans l'environnement
 *   - ':memory:' en test (base vierge à chaque fichier de test Jest)
 *   - src/data/app.prod.sqlite sinon
 */
const isTest = process.env.ENVIRONMENT?.trim() === 'test';

export const dbPath =
  process.env.DB_PATH ||
  (isTest ? ':memory:' : path.join(__dirname, '..', 'data', 'app.prod.sqlite'));

if (dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');
if (dbPath !== ':memory:') {
  db.exec('PRAGMA journal_mode = WAL;');
}

// Schéma : créé au premier démarrage, sans effet s'il existe déjà
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS todos (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
`);

/** Vide toutes les tables (utilisé par le seed et les tests). */
export const resetDatabase = () => {
  db.exec('DELETE FROM todos; DELETE FROM users;');
};

/** Exécute `fn` dans une transaction (rollback si exception). */
export const transaction = (fn) => {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

export const closeDatabase = () => {
  if (db.isOpen) db.close();
};

export default db;
