import apiClient from './client';

/**
 * Servicio de cursos y certificaciones — conecta con el backend NestJS.
 *
 * Endpoints esperados en NestJS:
 *   GET /cursos                  → [ curso, ... ]
 *   GET /cursos/:slug            → curso
 *   GET /certificaciones         → [ cert, ... ]
 *   GET /certificaciones/:slug   → cert
 *   POST /ordenes                → crear orden de compra
 */

export const cursosService = {
  async getCapacitaciones() {
    const { data } = await apiClient.get('/catalog?tipo=capacitacion');
    return data;
  },

  async getCapacitacionBySlug(slug) {
    const { data } = await apiClient.get(`/catalog/${slug}`);
    return data;
  },

  async getCertificaciones() {
    const { data } = await apiClient.get('/catalog?tipo=certificacion');
    return data;
  },

  async getDestacados() {
    const { data } = await apiClient.get('/catalog?destacado=true');
    return data;
  },

  async getCertificacionBySlug(slug) {
    const { data } = await apiClient.get(`/catalog/${slug}`);
    return data;
  },

  async crearOrden(orderData, comprobanteFile) {
    const formData = new FormData();
    formData.append('comprobante', comprobanteFile);

    // Solo enviamos items (id + cantidad) — el servidor calcula el precio desde la BD
    const safeData = {
      items: (orderData.items || []).map(({ id, cantidad }) => ({ id, cantidad })),
    };
    formData.append('data', JSON.stringify(safeData));

    // No fijar Content-Type manualmente — axios + XHR del navegador lo pone
    // automáticamente como "multipart/form-data; boundary=..." con el boundary correcto.
    // Si se fija a mano sin boundary, multer no puede parsear el archivo.
    const { data } = await apiClient.post('/ordenes', formData, {
      headers: { 'Content-Type': null },
    });
    return data;
  },

  async enviarContacto(contactData) {
    const { data } = await apiClient.post('/contacto', contactData);
    return data;
  },
};
