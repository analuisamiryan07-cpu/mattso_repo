import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import './MisCursos.css';

const SITIO_PUBLICO_URL = import.meta.env.VITE_SITIO_PUBLICO_URL || 'https://sapper-industries.com';

// "Mis cursos" — reemplaza al viejo portón de una sola clave para toda la
// cuenta. Ahora cada curso tiene su propia clave (canjeada en
// AñadirCurso) y su propio vencimiento; esta pantalla solo muestra lo que
// esté vigente en este momento, separado en Moodle / Coursera. Si no hay
// nada vigente (nunca canjeó nada, o todo se le venció), se muestra el
// aviso de suscripción + un carrusel de cursos sugeridos.
const MisCursos = () => {
  const [data, setData] = useState(null); // { moodle: [], coursera: [] }
  const [error, setError] = useState(null);
  const [mostrarAñadir, setMostrarAñadir] = useState(false);

  const cargar = () => {
    lmsService.getMisCursos().then(setData).catch(() => setError('No se pudieron cargar tus cursos.'));
  };

  useEffect(cargar, []);

  if (error) return <div className="lms-page"><p className="lms-error">{error}</p></div>;
  if (!data) return <div className="lms-page"><p>Cargando…</p></div>;

  const sinCursos = data.moodle.length === 0 && data.coursera.length === 0;

  return (
    <div className="lms-page">
      <div className="lms-page-header">
        <h1 className="lms-page-title">Mis cursos</h1>
        {!sinCursos && (
          <button className="lms-btn-añadir" onClick={() => setMostrarAñadir((v) => !v)}>
            <i className="fa-solid fa-plus" /> Añadir más cursos
          </button>
        )}
      </div>

      {mostrarAñadir && (
        <AñadirCursoForm
          onSuccess={() => { setMostrarAñadir(false); cargar(); }}
          onCancel={() => setMostrarAñadir(false)}
        />
      )}

      {sinCursos ? (
        <EstadoVacio onAñadido={cargar} mostrarFormInicial={!mostrarAñadir} />
      ) : (
        <>
          {data.moodle.length > 0 && (
            <SeccionCursos titulo="Cursos en Moodle" cursos={data.moodle} rutaBase="/curso/tradicional" tipoBadge="trad" />
          )}
          {data.coursera.length > 0 && (
            <SeccionCursos titulo="Cursos en Coursera" cursos={data.coursera} rutaBase="/curso/vod" tipoBadge="vod" />
          )}
        </>
      )}
    </div>
  );
};

const SeccionCursos = ({ titulo, cursos, rutaBase, tipoBadge }) => (
  <section className="lms-seccion">
    <h2 className="lms-seccion-title">{titulo}</h2>
    <div className="lms-cursos-grid">
      {cursos.map((c) => (
        <Link key={c.access_grant_id} to={`${rutaBase}/${c.course.id}`} className="lms-curso-card">
          <div className="lms-curso-card-top">
            <span className={`lms-badge lms-badge--${tipoBadge}`}>
              {tipoBadge === 'vod' ? 'Coursera' : 'Moodle'}
            </span>
            <h3>{c.course.titulo}</h3>
          </div>
          <div className="lms-progress-bar">
            <div className="lms-progress-fill" style={{ width: `${c.progreso_pct}%` }} />
          </div>
          <p className="lms-progress-label">{c.progreso_pct}% completado</p>
          {c.expires_at && (
            <p className="lms-vence">
              Vence el {new Date(c.expires_at).toLocaleDateString('es-EC')}
            </p>
          )}
        </Link>
      ))}
    </div>
  </section>
);

const EstadoVacio = ({ onAñadido }) => {
  const [sugeridos, setSugeridos] = useState([]);

  useEffect(() => {
    lmsService.getCursosSugeridos().then((d) => setSugeridos(Array.isArray(d) ? d.slice(0, 8) : [])).catch(() => {});
  }, []);

  return (
    <div className="lms-vacio">
      <div className="lms-vacio-aviso">
        <i className="fa-solid fa-circle-info" />
        <h2>No estás inscrito a ningún curso</h2>
        <p>Suscríbete para mayores beneficios.</p>
      </div>

      <AñadirCursoForm onSuccess={onAñadido} embebido />

      {sugeridos.length > 0 && (
        <div className="lms-carrusel">
          <h3>Cursos que te pueden interesar</h3>
          <div className="lms-carrusel-track">
            {sugeridos.map((c) => (
              <a key={c.id} href={`${SITIO_PUBLICO_URL}/curso/${c.slug}`} target="_blank" rel="noopener noreferrer" className="lms-carrusel-card">
                <span className="lms-carrusel-title">{c.titulo}</span>
                <span className="lms-carrusel-precio">${c.precio?.toFixed(2)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AñadirCursoForm = ({ onSuccess, onCancel, embebido }) => {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clave.trim()) { setError('Escribe el código que te enviamos por correo.'); return; }
    setLoading(true);
    setError('');
    setOk('');
    try {
      const res = await lmsService.canjearClave(clave.trim());
      setOk(`¡Listo! "${res.curso?.titulo}" ya está en tus cursos.`);
      setClave('');
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo validar la clave.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`lms-añadir-form ${embebido ? 'lms-añadir-form--embebido' : ''}`} onSubmit={handleSubmit}>
      <label htmlFor="clave-curso">Código de acceso al curso</label>
      <div className="lms-añadir-row">
        <input
          id="clave-curso"
          type="text"
          inputMode="numeric"
          value={clave}
          onChange={(e) => setClave(e.target.value.replace(/\D/g, '').slice(0, 12))}
          placeholder="0000000000"
          maxLength={12}
          autoComplete="off"
        />
        <button type="submit" disabled={loading}>{loading ? 'Validando…' : 'Añadir curso'}</button>
        {onCancel && <button type="button" className="lms-añadir-cancelar" onClick={onCancel}>Cancelar</button>}
      </div>
      {error && <p className="lms-error" style={{ marginTop: 8 }}>{error}</p>}
      {ok && <p className="lms-ok" style={{ marginTop: 8 }}>{ok}</p>}
    </form>
  );
};

export default MisCursos;
