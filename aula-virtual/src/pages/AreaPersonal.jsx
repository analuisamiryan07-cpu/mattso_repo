// Área Personal de Coursera — Moodle tiene sus propias páginas
// (pages/moodle/AreaPersonalMoodle.jsx y MisCursosMoodle.jsx), con su propio
// header, barra de pestañas, línea de tiempo y calendario. Coursera se
// queda como una sola página (dashboard + mis cursos), tal como se acordó.

import { useEffect, useState } from 'react';
import { lmsService } from '@api/lmsService';
import AulaHeader from '@layout/AulaHeader';
import AulaFooter from '@layout/AulaFooter';
import BackButton from '@layout/BackButton';
import TileResumen from '@components/TileResumen';
import CursosGrid from '@components/CursosGrid';
import AñadirCursoForm from '@components/AñadirCursoForm';
import '@components/TileResumen.css';
import './AreaPersonal.css';

const AreaPersonal = () => {
  const [resumen, setResumen] = useState(null);
  const [cursos, setCursos] = useState(null);
  const [mostrarAñadir, setMostrarAñadir] = useState(false);
  const [error, setError] = useState(null);

  const cargar = () => {
    lmsService.getResumenModalidad('ASINCRONO_VOD').then(setResumen).catch(() => {});
    lmsService.getMisCursos()
      .then((data) => setCursos(data.coursera))
      .catch(() => setError('No se pudieron cargar tus cursos.'));
  };

  useEffect(cargar, []);

  return (
    <div className="ap-shell">
      <AulaHeader variant="area" />

      <main className="ap-main">
        <BackButton to="/" label="Volver al panel general" />
        <h1 className="ap-title">Área personal — Coursera</h1>

        {resumen && (
          <div className="tr-tiles">
            <TileResumen icono="fa-graduation-cap" valor={resumen.cursos_inscritos} label="Cursos inscritos" />
            <TileResumen icono="fa-circle-check" valor={resumen.cursos_completados} label="Cursos completados" />
            <TileResumen icono="fa-hourglass-half" valor={`${resumen.actividades_pendientes_pct}%`} label="Actividades pendientes" />
            <TileResumen icono="fa-chart-line" valor={`${resumen.actividades_completadas_pct}%`} label="Actividades completadas" />
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
            <p>Todavía no tienes cursos de Coursera vigentes.</p>
            <AñadirCursoForm onSuccess={cargar} embebido />
          </div>
        )}

        {cursos && cursos.length > 0 && (
          <CursosGrid cursos={cursos} rutaBase="/curso/vod" label="Coursera" tipoBadge="vod" />
        )}
      </main>

      <AulaFooter />
    </div>
  );
};

export default AreaPersonal;
