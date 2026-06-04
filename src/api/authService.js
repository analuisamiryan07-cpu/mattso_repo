import apiClient from './client';

/**
 * Servicio de autenticación — conecta con los endpoints /auth de NestJS.
 *
 * NestJS espera:
 *   POST /auth/login    { email, password }  → { access_token, user }
 *   POST /auth/register { nombre, email, password } → { access_token, user }
 *   GET  /auth/profile  (con Bearer token)   → { user }
 */

export const authService = {
  /**
   * Inicia sesión con email y contraseña.
   * Guarda el token y los datos del usuario en localStorage.
   */
  async login(email, password) {
    const { data } = await apiClient.post('/auth/login', { correo: email, password });
    localStorage.setItem('matsso_token', data.access_token);
    localStorage.setItem('matsso_user', JSON.stringify(data.user));
    return data;
  },

  /**
   * Registra un nuevo usuario.
   */
  async register(nombre, email, password) {
    const { data } = await apiClient.post('/auth/register', { nombre, correo: email, password });
    localStorage.setItem('matsso_token', data.access_token);
    localStorage.setItem('matsso_user', JSON.stringify(data.user));
    return data;
  },

  /**
   * Cierra sesión eliminando los datos de localStorage.
   */
  logout() {
    localStorage.removeItem('matsso_token');
    localStorage.removeItem('matsso_user');
  },

  /**
   * Retorna el usuario almacenado localmente (no hace petición).
   */
  getCurrentUser() {
    const user = localStorage.getItem('matsso_user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Retorna true si hay un token guardado.
   */
  isAuthenticated() {
    return !!localStorage.getItem('matsso_token');
  },

  /**
   * Obtiene el perfil actualizado desde el servidor.
   */
  async getProfile() {
    const { data } = await apiClient.get('/auth/profile');
    return data;
  },
};
