import apiClient from './client';

export const lmsService = {
  async getMisCursos() {
    const { data } = await apiClient.get('/lms/courses');
    return data;
  },

  // mode: 'TRADICIONAL' (Moodle) | 'ASINCRONO_VOD' (Coursera) — un curso
  // puede tener las dos, así que hay que decir cuál se quiere ver.
  async getCursoDetalle(courseId, mode) {
    const { data } = await apiClient.get(`/lms/courses/${courseId}`, { params: { mode } });
    return data;
  },

  async enviarVideoPing(contentItemId, currentTime, totalDuration) {
    const { data } = await apiClient.post('/lms/progress/video-ping', {
      content_item_id: contentItemId,
      current_time: currentTime,
      total_duration: totalDuration,
    });
    return data;
  },

  async marcarDocumentoLeido(contentItemId) {
    const { data } = await apiClient.post(`/lms/content/${contentItemId}/mark-read`);
    return data;
  },

  async enviarEntrega(contentItemId, archivo, comentario) {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (comentario) formData.append('comentario', comentario);
    const { data } = await apiClient.post(`/lms/content/${contentItemId}/submissions`, formData, {
      headers: { 'Content-Type': null },
    });
    return data;
  },

  async getQuiz(contentItemId) {
    const { data } = await apiClient.get(`/lms/content/${contentItemId}/quiz`);
    return data;
  },

  async iniciarIntento(quizId) {
    const { data } = await apiClient.post(`/lms/quizzes/${quizId}/attempts`);
    return data;
  },

  async enviarIntento(attemptId, answers) {
    const { data } = await apiClient.post(`/lms/quizzes/attempts/${attemptId}/submit`, { answers });
    return data;
  },

  // ── Añadir curso: canjear la clave que mandó el sistema interno ─────
  // Reemplaza al viejo portón de un solo código para todo — ahora es una
  // clave JWT por cada curso comprado, y se puede usar en cualquier momento
  // (la primera vez, o cada vez que se quiera añadir un curso más).
  async canjearClave(clave) {
    const { data } = await apiClient.post('/lms/access-grants/canjear', { clave });
    return data; // { ok, curso, expires_at }
  },

  // Para el carrusel de "sin cursos activos" — mismo catálogo público que
  // usa la página principal, no hace falta sesión especial.
  async getCursosSugeridos() {
    const { data } = await apiClient.get('/catalog', { params: { tipo: 'curso' } });
    return data;
  },

  // ── Profesor ────────────────────────────────────────────────────────
  async getMisCursosProfesor() {
    const { data } = await apiClient.get('/lms/professor/courses');
    return data;
  },

  async crearCursoProfesor(curso) {
    const { data } = await apiClient.post('/lms/professor/courses', curso);
    return data;
  },

  async getMiCursoProfesor(courseId) {
    const { data } = await apiClient.get(`/lms/professor/courses/${courseId}`);
    return data;
  },

  async crearModuloProfesor(courseId, modulo) {
    const { data } = await apiClient.post(`/lms/professor/courses/${courseId}/modules`, modulo);
    return data;
  },

  async crearContenidoProfesor(moduleId, contenido) {
    const { data } = await apiClient.post(`/lms/professor/modules/${moduleId}/content`, contenido);
    return data;
  },

  async getEntregasPendientesProfesor() {
    const { data } = await apiClient.get('/lms/professor/submissions/pending');
    return data;
  },

  async calificarEntregaProfesor(submissionId, score, feedback) {
    const { data } = await apiClient.post(`/lms/professor/submissions/${submissionId}/grade`, { score, feedback });
    return data;
  },
};
