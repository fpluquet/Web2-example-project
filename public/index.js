// Page d'entrée "/" : redirige selon la présence d'un token.
// Si le token est expiré, la page des tâches renverra vers la connexion.
import { getToken, PAGES } from './assets/js/api.js';

location.replace(getToken() ? PAGES.todos : PAGES.login);
