import apiClient from './client';

export const lmsService = {
  async getMisCursos() {
    const { data } = await apiClient.get('/lms/courses');
    return data;
  },

  // Las 4 tarjetas del dashboard de Área Personal — cursos inscritos,
  // completados, % actividades pendientes/completadas, de esa modalidad.
  async getResumenModalidad(mode) {
    const { data } = await apiClient.get('/lms/courses/resumen', { params: { mode } });
    return data;
  },

  // mode: 'TRADICIONAL' (Moodle) | 'ASINCRONO_VOD' (Coursera) — un curso
  // puede tener las dos, así que hay que decir cuál se quiere ver.
  async getCursoDetalle(courseId, mode) {
    const { data } = await apiClient.get(`/lms/courses/${courseId}`, { params: { mode } });
    return data;
  },

  async getParticipantes(courseId) {
    const { data } = await apiClient.get(`/lms/courses/${courseId}/participantes`);
    return data;
  },

  // Línea de tiempo / calendario de Moodle — actividades con fecha límite de
  // todos los cursos Moodle vigentes, con el estado ya resuelto en el backend.
  async getLineaDeTiempo() {
    const { data } = await apiClient.get('/lms/courses/linea-de-tiempo');
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

  // ── Añadir curso: canjear el código que mandó el sistema interno ─────
  // Reemplaza al viejo portón de un solo código para toda la cuenta — ahora
  // es un código corto (10 dígitos) por cada curso comprado, y se puede usar
  // en cualquier momento (la primera vez, o cada vez que se quiera añadir un
  // curso más).
  async canjearClave(codigo) {
    const { data } = await apiClient.post('/lms/access-grants/canjear', { codigo });
    return data; // { ok, curso, expires_at }
  },

  // Para el carrusel de "sin cursos activos" — mismo catálogo público que
  // usa la página principal, no hace falta sesión especial.
  async getCursosSugeridos() {
    const { data } = await apiClient.get('/catalog', { params: { tipo: 'curso' } });
    return data;
  },

  // ── Profesor ────────────────────────────────────────────────────────
  // El profesor nunca crea cursos — el admin los crea y se los asigna desde
  // el sistema interno. Esto solo lee lo que ya le asignaron.
  async getMisCursosProfesor() {
    const { data } = await apiClient.get('/lms/professor/courses');
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

  // ── Mensajería (solo Moodle) ───────────────────────────────────────────
  async getProfesoresParaMensajear() {
    const { data } = await apiClient.get('/lms/messaging/profesores');
    return data;
  },

  async getConversacion(courseId) {
    const { data } = await apiClient.get(`/lms/messaging/conversaciones/${courseId}`);
    return data;
  },

  async enviarMensaje(courseId, cuerpo) {
    const { data } = await apiClient.post(`/lms/messaging/conversaciones/${courseId}/mensajes`, { cuerpo });
    return data;
  },

  // ── Notificaciones ──────────────────────────────────────────────────────
  async getNotificaciones() {
    const { data } = await apiClient.get('/lms/notifications');
    return data; // { items, no_leidas }
  },

  async marcarNotificacionLeida(id) {
    const { data } = await apiClient.post(`/lms/notifications/${id}/leido`);
    return data;
  },

  // ── Calendario (eventos personales, solo Moodle) ───────────────────────
  async getEventosPersonales() {
    const { data } = await apiClient.get('/lms/calendar/eventos');
    return data;
  },

  async crearEventoPersonal(titulo, fecha) {
    const { data } = await apiClient.post('/lms/calendar/eventos', { titulo, fecha });
    return data;
  },

  async actualizarEventoPersonal(id, titulo, fecha) {
    const { data } = await apiClient.patch(`/lms/calendar/eventos/${id}`, { titulo, fecha });
    return data;
  },

  async eliminarEventoPersonal(id) {
    const { data } = await apiClient.delete(`/lms/calendar/eventos/${id}`);
    return data;
  },
};
