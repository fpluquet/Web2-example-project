import bcrypt from 'bcryptjs';

/**
 * Modèle User : représentation métier d'un utilisateur.
 * Indépendant du stockage : n'importe ni repository ni service.
 */
class User {
  constructor(userData) {
    this.id = userData.id || Date.now().toString();
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.role = userData.role || 'user';
    this.createdAt = userData.createdAt || new Date().toISOString();
  }

  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  /** Sérialisation API : exclut le mot de passe. */
  toJSON() {
    const userObject = { ...this };
    delete userObject.password;
    return userObject;
  }
}

export default User;
