/**
 * Clé de signature des tokens JWT.
 * Aucune valeur de secours : sans JWT_SECRET, n'importe qui pourrait forger des tokens
 * avec une clé connue. L'absence de la variable est donc une erreur.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET n\'est pas défini. Ajoutez-le dans le fichier .env (voir .env.example).'
    );
  }
  return secret;
};

export default getJwtSecret;
