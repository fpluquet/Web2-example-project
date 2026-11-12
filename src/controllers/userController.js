import userService, { UserError } from '../services/userService.js';

// Obtenir le profil utilisateur
export const getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.userId);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error instanceof UserError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour le profil utilisateur
export const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user.userId, req.body);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error instanceof UserError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir la liste des utilisateurs (admin seulement)
export const getUsers = async (req, res) => {
  try {
    // page / limit / sort / order sont validés (et page / limit convertis en entiers) par listUsersValidation
    const { page = 1, limit = 10, sort, order } = req.query;

    const data = await userService.getUsers({ page, limit, sort, order });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    if (error instanceof UserError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Changer le mot de passe utilisateur
export const changePassword = async (req, res) => {
  try {
    const result = await userService.changePassword(req.user.userId, req.body);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    if (error instanceof UserError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export default { getProfile, updateProfile, getUsers, changePassword };
