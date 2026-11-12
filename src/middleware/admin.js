import userRepository from '../repositories/UserRepository.js';

// Middleware pour vérifier les rôles d'administrateur
const adminMiddleware = async (req, res, next) => {
  try {
    // Récupérer l'utilisateur complet via le repository
    const user = await userRepository.findById(req.user.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que l'utilisateur a le rôle admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Droits administrateur requis.'
      });
    }

    // Ajouter les informations utilisateur complètes à la requête
    req.userFull = user;
    next();

  } catch (error) {
    console.error('Erreur dans le middleware admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export default adminMiddleware;