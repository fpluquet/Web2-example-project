import authService, { AuthError } from '../services/authService.js';

// Inscription
export const register = async (req, res) => {
  try {
    const data = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Connexion
export const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export default { register, login };
