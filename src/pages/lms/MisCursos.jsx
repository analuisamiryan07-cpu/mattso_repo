
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import './MisCursos.css';

const MisCursos = () => {
  const [cursos, setCursos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    lmsService
      .getMisCursos()
      .then(setCursos)
      .catch(() => setError('No se pudieron cargar tus cursos.'));
  }, []);

  if (error) return <div className="lms-page"><p className="lms-error">{error}</p></div>;
  if (!cursos) return <div className="lms-page"><p>Cargando…</p></div>;

  return (
    <div className="lms-page">
      <h1 className="lms-page-title">Mis cursos</h1>
      {cursos.length === 0 && (
        <p className="lms-empty">Todavía no tienes cursos inscritos. Revisa el catálogo de certificaciones y capacitaciones.</p>
      )}
      <div className="lms-cursos-grid">
        {cursos.map((c) => (
          <Link key={c.enrollment_id} to={`/aula-virtual/curso/${c.course.id}`} className="lms-curso-card">
            <div className="lms-curso-card-top">
              <span className={`lms-badge lms-badge--${c.course.delivery_mode === 'ASINCRONO_VOD' ? 'vod' : 'trad'}`}>
                {c.course.delivery_mode === 'ASINCRONO_VOD' ? 'Video bajo demanda' : 'Tradicional'}
              </span>
              <h3>{c.course.titulo}</h3>
            </div>
            <div className="lms-progress-bar">
              <div className="lms-progress-fill" style={{ width: `${c.progreso_pct}%` }} />
            </div>
            <p className="lms-progress-label">{c.progreso_pct}% completado</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MisCursos;

// Rutas sugeridas para src/App.jsx (protegidas — mismo patrón que <ProtectedRoute>
// si ya existe uno, o replicando el check de matsso_token que usa MisCertificados):
//   <Route path="/mis-cursos" element={<MisCursos />} />
//   <Route path="/mis-cursos/:courseId" element={<CursoDetalle />} />
