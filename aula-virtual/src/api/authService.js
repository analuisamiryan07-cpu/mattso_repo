import apiClient from './client';

/**
 * A diferencia del login del sitio público, este SIEMPRE pasa por
 * POST /lms/gate/login: valida credenciales Y que la cuenta tenga al menos
 * una orden pagada (Orden.estado='PAGADA') antes de entregar el token.
 * Si la cuenta existe y la contraseña es correcta pero no hay orden pagada,
 * el backend responde 403 con message='SIN_INSCRIPCION' — ver
 * lms-gate.service.ts en el backend.
 */
export const authService = {
  async gateLogin(email, password, aceptaTerminos) {
    const { data } = await apiClient.post('/lms/gate/login', {
      correo: email,
      password,
      acepta_terminos: aceptaTerminos,
    });
    localStorage.setItem('matsso_token', data.access_token);
    localStorage.setItem('matsso_user', JSON.stringify(data.user));
    return data;
  },

  // Para saber si mostrar la casilla de Términos o solo el enlace — no
  // revela si la cuenta existe, solo si falta aceptar.
  async necesitaTerminos(email) {
    const { data } = await apiClient.get('/lms/gate/necesita-terminos', { params: { correo: email } });
    return data.necesita;
  },

  logout() {
    localStorage.removeItem('matsso_token');
    localStorage.removeItem('matsso_user');
  },

  // Sesión deslizante: mientras haya actividad, se pide un token nuevo antes
  // de que venza el actual — ver hooks/useSlidingSession.js.
  async refresh() {
    const { data } = await apiClient.post('/auth/refresh');
    localStorage.setItem('matsso_token', data.access_token);
    return data;
  },

  getCurrentUser() {
    const user = localStorage.getItem('matsso_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('matsso_token');
  },
};
