import apiClient from './client';

export const certificatesService = {
  async searchByName(nombre) {
    const { data } = await apiClient.get('/certificates/search', {
      params: { nombre: nombre.trim() },
    });
    return data;
  },
};
