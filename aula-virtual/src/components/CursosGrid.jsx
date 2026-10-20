// Grilla de tarjetas de curso — la usan AreaPersonal (Coursera) y
// MisCursosMoodle. Puramente presentacional: recibe los cursos ya
// resueltos/filtrados, no pega al backend.
import { Link } from 'react-router-dom';
import '@pages/MisCursos.css';

const CursosGrid = ({ cursos, rutaBase, label, tipoBadge }) => (
  <div className="lms-cursos-grid">
    {cursos.map((c) => (
      <Link key={c.access_grant_id} to={`${rutaBase}/${c.course.id}`} className="lms-curso-card">
        <div className="lms-curso-card-top">
          <span className={`lms-badge lms-badge--${tipoBadge}`}>{label}</span>
          <h3>{c.course.titulo}</h3>
        </div>
        <div className="lms-progress-bar">
          <div className="lms-progress-fill" style={{ width: `${c.progreso_pct}%` }} />
        </div>
        <p className="lms-progress-label">{c.progreso_pct}% completado</p>
        {c.expires_at && (
          <p className="lms-vence">Vence el {new Date(c.expires_at).toLocaleDateString('es-EC')}</p>
        )}
      </Link>
    ))}
  </div>
);

export default CursosGrid;
