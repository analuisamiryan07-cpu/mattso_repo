// Área Personal — una sola pantalla reutilizada para Moodle y Coursera
// (parametrizada por `mode`), a la que se llega desde el botón "Periodo
// 2026" del Panel General. Dashboard de 4 tarjetas + "Mis cursos" de esa
// modalidad (reutiliza las clases lms-* que ya tenía MisCursos.jsx).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import AulaHeader from '@layout/AulaHeader';
import AulaFooter from '@layout/AulaFooter';
import BackButton from '@layout/BackButton';
import '@pages/MisCursos.css';
import './AreaPersonal.css';

const CONFIG = {
  moodle: { label: 'Moodle', apiMode: 'TRADICIONAL', rutaBase: '/curso/tradicional', tipoBadge: 'trad' },
  coursera: { label: 'Coursera', apiMode: 'ASINCRONO_VOD', rutaBase: '/curso/vod', tipoBadge: 'vod' },
};

const AreaPersonal = ({ modalidad }) => {
  const cfg = CONFIG[modalidad];
  const [resumen, setResumen] = useState(null);
  const [cursos, setCursos] = useState(null);
  const [mostrarAñadir, setMostrarAñadir] = useState(false);
  const [error, setError] = useState(null);

  const cargar = () => {
    lmsService.getResumenModalidad(cfg.apiMode).then(setResumen).catch(() => {});
    lmsService.getMisCursos()
      .then((data) => setCursos(modalidad === 'moodle' ? data.moodle : data.coursera))
      .catch(() => setError('No se pudieron cargar tus cursos.'));
  };

  useEffect(cargar, [modalidad]);

  return (
    <div className="ap-shell">
      <AulaHeader variant="area" />

      <main className="ap-main">
        <BackButton to="/" label="Volver al panel general" />
        <h1 className="ap-title">Área personal — {cfg.label}</h1>

        {resumen && (
          <div className="ap-tiles">
            <Tile icono="fa-graduation-cap" valor={resumen.cursos_inscritos} label="Cursos inscritos" />
            <Tile icono="fa-circle-check" valor={resumen.cursos_completados} label="Cursos completados" />
            <Tile icono="fa-hourglass-half" valor={`${resumen.actividades_pendientes_pct}%`} label="Actividades pendientes" />
            <Tile icono="fa-chart-line" valor={`${resumen.actividades_completadas_pct}%`} label="Actividades completadas" />
          </div>
        )}

        <div className="lms-page-header" style={{ marginTop: 36 }}>
          <h2 className="lms-seccion-title" style={{ margin: 0 }}>Mis cursos</h2>
          {cursos && cursos.length > 0 && (
            <button className="lms-btn-añadir" onClick={() => setMostrarAñadir((v) => !v)}>
              <i className="fa-solid fa-plus" /> Añadir más cursos
            </button>
          )}
        </div>

        {mostrarAñadir && (
          <AñadirCursoForm onSuccess={() => { setMostrarAñadir(false); cargar(); }} onCancel={() => setMostrarAñadir(false)} />
        )}

        {error && <p className="lms-error">{error}</p>}

        {cursos && cursos.length === 0 && !mostrarAñadir && (
          <div className="ap-vacio">
            <p>Todavía no tienes cursos de {cfg.label} vigentes.</p>
            <AñadirCursoForm onSuccess={cargar} embebido />
          </div>
        )}

        {cursos && cursos.length > 0 && (
          <div className="lms-cursos-grid">
            {cursos.map((c) => (
              <Link key={c.access_grant_id} to={`${cfg.rutaBase}/${c.course.id}`} className="lms-curso-card">
                <div className="lms-curso-card-top">
                  <span className={`lms-badge lms-badge--${cfg.tipoBadge}`}>{cfg.label}</span>
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
        )}
      </main>

      <AulaFooter />
    </div>
  );
};

const Tile = ({ icono, valor, label }) => (
  <div className="ap-tile">
    <i className={`fa-solid ${icono}`} />
    <strong>{valor}</strong>
    <span>{label}</span>
  </div>
);

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
      <label htmlFor="ap-clave">Código de acceso al curso</label>
      <div className="lms-añadir-row">
        <input
          id="ap-clave"
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

export default AreaPersonal;
