import axios from 'axios';

/**
 * Cliente HTTP global configurado para el backend NestJS.
 * Todas las peticiones se hacen relativas a VITE_API_URL (o localhost:3000 en dev).
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// Adjunta el JWT en cada petición si existe en localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('matsso_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Manejo global de errores de respuesta
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('matsso_token');
      localStorage.removeItem('matsso_user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
