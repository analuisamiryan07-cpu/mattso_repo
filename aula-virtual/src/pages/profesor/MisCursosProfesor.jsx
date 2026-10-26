// Vista del profesor: sus cursos (asignados por el admin desde el sistema
// interno — el profesor no crea cursos) + entregas pendientes de calificar.
// Cada tarjeta lleva al detalle del curso (CursoProfesor.jsx) para agregar
// módulos y contenido Moodle.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import { useToast } from '@context/ToastContext';
import './MisCursosProfesor.css';

const MisCursosProfesor = () => {
  const { addToast } = useToast();
  const [cursos, setCursos] = useState(null);
  const [pendientes, setPendientes] = useState(null);
  const [calificando, setCalificando] = useState({});

  const cargar = () => {
    lmsService.getMisCursosProfesor().then(setCursos).catch(() => addToast('No se pudieron cargar tus cursos.', 'error'));
    lmsService.getEntregasPendientesProfesor().then(setPendientes).catch(() => addToast('No se pudieron cargar las entregas pendientes.', 'error'));
  };

  useEffect(cargar, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <Link key={c.id} to={`/curso/${c.id}`} className="mcp-card">
            <span className="mcp-badge">Moodle</span>
            <h3>{c.titulo}</h3>
            <p className="mcp-meta">{c._count.modules} módulos · {c._count.enrollments} estudiantes</p>
          </Link>
        ))}
        {cursos.length === 0 && <p className="mcp-empty">Todavía no tienes ningún curso asignado. El administrador te asigna los cursos desde el sistema interno.</p>}
      </div>

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
