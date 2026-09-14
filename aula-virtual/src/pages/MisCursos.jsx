import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import './MisCursos.css';

const MisCursos = () => {
  const [cursos, setCursos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    lmsService.getMisCursos().then(setCursos).catch(() => setError('No se pudieron cargar tus cursos.'));
  }, []);

  if (error) return <div className="lms-page"><p className="lms-error">{error}</p></div>;
  if (!cursos) return <div className="lms-page"><p>Cargando…</p></div>;

  return (
    <div className="lms-page">
      <h1 className="lms-page-title">Mis cursos</h1>
      {cursos.length === 0 && (
        <p className="lms-empty">Todavía no tienes cursos inscritos.</p>
      )}
      <div className="lms-cursos-grid">
        {cursos.map((c) => {
          const esVod = c.course.delivery_mode === 'ASINCRONO_VOD';
          const ruta = esVod ? `/curso/vod/${c.course.id}` : `/curso/tradicional/${c.course.id}`;
          return (
            <Link key={c.enrollment_id} to={ruta} className="lms-curso-card">
              <div className="lms-curso-card-top">
                <span className={`lms-badge lms-badge--${esVod ? 'vod' : 'trad'}`}>
                  {esVod ? 'Video bajo demanda' : 'Tradicional'}
                </span>
                <h3>{c.course.titulo}</h3>
              </div>
              <div className="lms-progress-bar">
                <div className="lms-progress-fill" style={{ width: `${c.progreso_pct}%` }} />
              </div>
              <p className="lms-progress-label">{c.progreso_pct}% completado</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MisCursos;
