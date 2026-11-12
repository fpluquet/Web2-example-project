/**
 * Seed de la base SQLite.
 *
 *   npm run seed  -> vide la base puis insère les données de démo
 *                    (compte admin + 100 utilisateurs générés avec 0 à 5 todos chacun)
 *
 * ATTENTION : toutes les données existantes de la base sont supprimées.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import User from '../models/User.js';
import Todo from '../models/Todo.js';
import db, { dbPath, resetDatabase, transaction, closeDatabase } from './database.js';

// ---------- Données de démo ----------

const DEMO_USERS = [
  { username: 'admin', email: 'admin@example.com', password: 'Admin1234', role: 'admin' }
];

// ---------- Utilisateurs générés ----------

const GENERATED_USERS = 100;
const GENERATED_PASSWORD = 'Password123';

const FIRST_NAMES = [
  'lucas', 'emma', 'hugo', 'lea', 'louis', 'chloe', 'gabriel', 'manon', 'arthur', 'camille',
  'jules', 'sarah', 'adam', 'ines', 'nathan', 'julie', 'tom', 'clara', 'leo', 'zoe'
];
const LAST_NAMES = [
  'martin', 'bernard', 'dubois', 'thomas', 'robert', 'richard', 'petit', 'durand', 'leroy', 'moreau',
  'simon', 'laurent', 'lefebvre', 'michel', 'garcia', 'david', 'bertrand', 'roux', 'vincent', 'fournier'
];
const TODO_TITLES = [
  'Faire les courses', 'Répondre aux emails', 'Prendre rendez-vous chez le dentiste',
  'Sortir les poubelles', 'Réserver les billets de train', 'Lire un chapitre',
  'Mettre à jour le CV', 'Arroser les plantes', 'Faire du sport', 'Ranger le bureau',
  'Payer le loyer', 'Préparer la présentation', 'Appeler maman', 'Laver la voiture'
];

// Générateur pseudo-aléatoire à graine fixe : le seed produit toujours les mêmes données
const random = (() => {
  let s = 42;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
const pick = (list) => list[Math.floor(random() * list.length)];

// ---------- Construction des objets (hashage async hors transaction) ----------

const users = [];
const todos = [];

// Dates étalées pour que l'ordre de création soit lisible dans l'API
let clock = Date.now() - 60 * 60 * 1000;
const nextDate = () => new Date((clock += 1000)).toISOString();

// Même mot de passe pour tous les comptes générés : un seul hashage (bcrypt est lent)
const generatedHash = new User({ password: GENERATED_PASSWORD });
await generatedHash.hashPassword();

const DAY = 24 * 60 * 60 * 1000;
for (let i = 1; i <= GENERATED_USERS; i++) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const n = String(i).padStart(3, '0');
  // Inscriptions étalées sur les GENERATED_USERS derniers jours, de la plus ancienne à la plus récente
  const createdAt = new Date(Date.now() - (GENERATED_USERS - i + 1) * DAY).toISOString();

  const user = new User({
    id: randomUUID(),
    username: `${first}_${last}${n}`,
    email: `${first}.${last}${n}@example.com`,
    password: generatedHash.password,
    role: 'user',
    createdAt
  });
  users.push(user);

  // 0 à 5 todos par utilisateur, créées après l'inscription
  const todoCount = Math.floor(random() * 6);
  for (let j = 0; j < todoCount; j++) {
    const todoDate = new Date(Date.parse(createdAt) + (j + 1) * 60 * 60 * 1000).toISOString();
    todos.push(new Todo({
      userId: user.id,
      title: pick(TODO_TITLES),
      completed: random() < 0.4,
      createdAt: todoDate
    }));
  }
}

for (const demo of DEMO_USERS) {
  const user = new User({ ...demo, id: randomUUID(), createdAt: nextDate() });
  await user.hashPassword();
  users.push(user);
}

// ---------- Écriture ----------

const insertUser = db.prepare(`
  INSERT INTO users (id, username, email, password, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const insertTodo = db.prepare(`
  INSERT INTO todos (id, user_id, title, completed, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

try {
  transaction(() => {
    resetDatabase();
    for (const u of users) {
      insertUser.run(u.id, u.username, u.email, u.password, u.role, u.createdAt);
    }
    for (const t of todos) {
      insertTodo.run(t.id, t.userId, t.title, t.completed ? 1 : 0, t.createdAt, t.updatedAt);
    }
  });
} catch (error) {
  console.error(`Seed annulé (aucune donnée modifiée) : ${error.message}`);
  closeDatabase();
  process.exit(1);
}

console.log(`Base : ${dbPath}`);
console.log(`${users.length} utilisateur(s), ${todos.length} todo(s) insérés.\n`);
console.log('Comptes de démo :');
for (const u of DEMO_USERS) {
  console.log(`  ${u.role.padEnd(5)}  ${u.email.padEnd(20)}  ${u.password}`);
}
console.log(`\n+ ${GENERATED_USERS} comptes générés (ex. ${users[0].email}), mot de passe : ${GENERATED_PASSWORD}`);

closeDatabase();
