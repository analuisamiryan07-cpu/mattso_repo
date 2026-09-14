// Vista del profesor: sus cursos + entregas pendientes de calificar. La
// creación de módulos/contenido (subir video, adjuntar quiz) todavía no
// tiene UI aquí — por ahora se hace vía la API con un cliente HTTP (Postman)
// hasta wiring de subida a Cloudinary desde el navegador. El profesor SÍ
// puede crear el curso y calificar, que es el flujo que se pidió primero.

import { useEffect, useState } from 'react';
import { lmsService } from '@api/lmsService';
import { useToast } from '@context/ToastContext';
import './MisCursosProfesor.css';

const MisCursosProfesor = () => {
  const { addToast } = useToast();
  const [cursos, setCursos] = useState(null);
  const [pendientes, setPendientes] = useState(null);
  const [nuevoCurso, setNuevoCurso] = useState({ titulo: '', delivery_mode: 'TRADICIONAL', descripcion: '' });
  const [creando, setCreando] = useState(false);
  const [calificando, setCalificando] = useState({});

  const cargar = () => {
    lmsService.getMisCursosProfesor().then(setCursos).catch(() => addToast('No se pudieron cargar tus cursos.', 'error'));
    lmsService.getEntregasPendientesProfesor().then(setPendientes).catch(() => addToast('No se pudieron cargar las entregas pendientes.', 'error'));
  };

  useEffect(cargar, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCrearCurso = async (e) => {
    e.preventDefault();
    if (!nuevoCurso.titulo.trim()) { addToast('Ponle un título al curso.', 'error'); return; }
    setCreando(true);
    try {
      await lmsService.crearCursoProfesor(nuevoCurso);
      addToast('Curso creado.', 'success');
      setNuevoCurso({ titulo: '', delivery_mode: 'TRADICIONAL', descripcion: '' });
      cargar();
    } catch (err) {
      addToast(err.response?.data?.message || 'No se pudo crear el curso.', 'error');
    } finally {
      setCreando(false);
    }
  };

  const handleCalificar = async (submissionId) => {
    const datos = calificando[submissionId];
    const score = Number(datos?.score);
    if (!datos?.score || score < 0 || score > 100) { addToast('Ingresa una nota entre 0 y 100.', 'error'); return; }
    try {
      await lmsService.calificarEntregaProfesor(submissionId, score, datos.feedback);
      addToast('Calificación guardada.', 'success');
      setPendientes((prev) => prev.filter((p) => p.id !== submissionId));
    } catch (err) {
      addToast(err.response?.data?.message || 'No se pudo guardar la calificación.', 'error');
    }
  };

  if (!cursos || !pendientes) return <p>Cargando…</p>;

  return (
    <div className="mcp">
      <h1 className="mcp-title">Mis cursos</h1>

      <div className="mcp-grid">
        {cursos.map((c) => (
          <div key={c.id} className="mcp-card">
            <span className={`mcp-badge ${c.delivery_mode === 'ASINCRONO_VOD' ? 'is-vod' : ''}`}>
              {c.delivery_mode === 'ASINCRONO_VOD' ? 'Video bajo demanda' : 'Tradicional'}
            </span>
            <h3>{c.titulo}</h3>
            <p className="mcp-meta">{c._count.modules} módulos · {c._count.enrollments} estudiantes</p>
          </div>
        ))}
        {cursos.length === 0 && <p className="mcp-empty">Todavía no has creado ningún curso.</p>}
      </div>

      <form className="mcp-form" onSubmit={handleCrearCurso}>
        <h2>Crear curso nuevo</h2>
        <input
          type="text" placeholder="Título del curso"
          value={nuevoCurso.titulo}
          onChange={(e) => setNuevoCurso((p) => ({ ...p, titulo: e.target.value }))}
        />
        <select
          value={nuevoCurso.delivery_mode}
          onChange={(e) => setNuevoCurso((p) => ({ ...p, delivery_mode: e.target.value }))}
        >
          <option value="TRADICIONAL">Tradicional (tareas y calificación humana)</option>
          <option value="ASINCRONO_VOD">Video bajo demanda (secuencial + quiz automático)</option>
        </select>
        <textarea
          placeholder="Descripción (opcional)"
          value={nuevoCurso.descripcion}
          onChange={(e) => setNuevoCurso((p) => ({ ...p, descripcion: e.target.value }))}
        />
        <button type="submit" className="mcp-btn" disabled={creando}>{creando ? 'Creando…' : 'Crear curso'}</button>
      </form>

      <h2 className="mcp-section-title">Entregas pendientes ({pendientes.length})</h2>
      {pendientes.length === 0 && <p className="mcp-empty">No hay entregas por calificar.</p>}
      <div className="mcp-pendientes">
        {pendientes.map((p) => (
          <div key={p.id} className="mcp-pendiente-row">
            <div className="mcp-pendiente-info">
              <b>{p.enrollment.usuario.correo}</b>
              <span>{p.content_item.titulo} — {p.content_item.module.course.titulo}</span>
            </div>
            <div className="mcp-pendiente-grade">
              <input
                type="number" min="0" max="100" placeholder="Nota"
                value={calificando[p.id]?.score || ''}
                onChange={(e) => setCalificando((prev) => ({ ...prev, [p.id]: { ...prev[p.id], score: e.target.value } }))}
              />
              <input
                type="text" placeholder="Comentario (opcional)"
                value={calificando[p.id]?.feedback || ''}
                onChange={(e) => setCalificando((prev) => ({ ...prev, [p.id]: { ...prev[p.id], feedback: e.target.value } }))}
              />
              <button className="mcp-btn" onClick={() => handleCalificar(p.id)}>Guardar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MisCursosProfesor;
