import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import userRepository from '../repositories/UserRepository.js';
import { getJwtSecret } from '../config/jwt.js';

/** Erreur métier avec code HTTP pour le contrôleur. */
export class AuthError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: '24h'
  });
};

/**
 * Service d'authentification : orchestre modèle + repository.
 * Le contrôleur ne parle qu'à ce service.
 */
export const register = async ({ username, email, password }) => {
  const existingByEmail = await userRepository.findByEmail(email);
  const existingByUsername = await userRepository.findByUsername(username);

  if (existingByEmail || existingByUsername) {
    throw new AuthError(
      'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà',
      400
    );
  }

  const user = new User({ username, email, password });
  await user.hashPassword();
  await userRepository.save(user);

  return {
    user: user.toJSON(),
    token: generateToken(user.id)
  };
};

export const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AuthError('Identifiants invalides', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AuthError('Identifiants invalides', 401);
  }

  return {
    user: user.toJSON(),
    token: generateToken(user.id)
  };
};

export default { register, login };
