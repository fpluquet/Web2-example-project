import userRepository from '../repositories/UserRepository.js';

/** Erreur métier avec code HTTP pour le contrôleur. */
export class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Service utilisateurs : orchestre modèle + repository.
 * Le contrôleur ne parle qu'à ce service.
 */
export const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UserError('Utilisateur non trouvé', 404);
  }
  return user.toJSON();
};

export const updateProfile = async (userId, { username, email }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UserError('Utilisateur non trouvé', 404);
  }

  if (email) {
    const existing = await userRepository.findByEmail(email);
    if (existing && existing.id !== userId) {
      throw new UserError(
        'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà',
        400
      );
    }
    user.email = email;
  }

  if (username) {
    const existing = await userRepository.findByUsername(username);
    if (existing && existing.id !== userId) {
      throw new UserError(
        'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà',
        400
      );
    }
    user.username = username;
  }

  await userRepository.save(user);
  return user.toJSON();
};

export const getUsers = async ({ page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = {}) => {
  const skip = (page - 1) * limit;
  const users = (await userRepository.find({ limit, offset: skip, sort, order }))
    .map((user) => user.toJSON());

  const total = await userRepository.countDocuments();

  return {
    users,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    }
  };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UserError('Utilisateur non trouvé', 404);
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new UserError('L\'ancien mot de passe est incorrect', 400);
  }

  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new UserError(
      'Le nouveau mot de passe doit être différent de l\'ancien',
      400
    );
  }

  user.password = newPassword;
  await user.hashPassword();
  await userRepository.save(user);

  return { message: 'Mot de passe modifié avec succès' };
};

export default { getProfile, updateProfile, getUsers, changePassword };
