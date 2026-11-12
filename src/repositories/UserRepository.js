import User from '../models/User.js';
import db from '../db/database.js';

/**
 * Repository User : CRUD uniquement, sur la table SQLite `users`.
 * Hydrate des instances User à la lecture.
 * Ne contient pas de règles métier (unicité, JWT, hashage…).
 */

// Colonnes triables (liste blanche) ; le texte est trié sans tenir compte de la casse
export const SORT_COLUMNS = {
  username: 'username COLLATE NOCASE',
  email: 'email COLLATE NOCASE',
  role: 'role',
  createdAt: 'created_at'
};

const toUser = (row) =>
  row
    ? new User({
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password,
        role: row.role,
        createdAt: row.created_at
      })
    : null;

class UserRepository {
  /** Crée l'utilisateur s'il n'existe pas encore, sinon le met à jour. */
  async save(user) {
    db.prepare(`
      INSERT INTO users (id, username, email, password, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        email    = excluded.email,
        password = excluded.password,
        role     = excluded.role
    `).run(user.id, user.username, user.email, user.password, user.role, user.createdAt);
    return user;
  }

  async findById(id) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return toUser(row);
  }

  async findByEmail(email) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return toUser(row);
  }

  async findByUsername(username) {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    return toUser(row);
  }

  /**
   * Liste triée, paginée si `limit` est fourni.
   * @param {object} [options]
   * @param {'username'|'email'|'role'|'createdAt'} [options.sort='createdAt']
   * @param {'asc'|'desc'} [options.order='desc']
   */
  async find({ limit, offset = 0, sort = 'createdAt', order = 'desc' } = {}) {
    const column = SORT_COLUMNS[sort];
    if (!column) throw new Error(`Tri impossible sur : ${sort}`);
    const direction = order === 'asc' ? 'ASC' : 'DESC';
    // rowid départage les égalités (même rôle, même date…) pour une pagination stable
    const orderBy = `ORDER BY ${column} ${direction}, rowid ${direction}`;

    const rows = limit === undefined
      ? db.prepare(`SELECT * FROM users ${orderBy}`).all()
      : db.prepare(`SELECT * FROM users ${orderBy} LIMIT ? OFFSET ?`).all(limit, offset);
    return rows.map(toUser);
  }

  async countDocuments() {
    return db.prepare('SELECT COUNT(*) AS total FROM users').get().total;
  }
}

export default new UserRepository();
