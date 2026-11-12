import { close } from '../../src/app.js';
import { resetDatabase, closeDatabase } from '../../src/db/database.js';

// En test (ENVIRONMENT=test), la base SQLite est en mémoire : on la vide entre chaque test
export const cleanupTestDatabase = () => {
  resetDatabase();
};

// Global test setup
afterEach(() => {
  cleanupTestDatabase();
});

afterAll(() => {
  if (close) {
    close();
  }
  closeDatabase();
});
