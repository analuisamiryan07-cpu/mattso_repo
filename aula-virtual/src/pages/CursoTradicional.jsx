// Vista "Moodle": acceso abierto a todo el contenido TRADICIONAL de un
// curso — sin candados secuenciales (courses.service.ts no los aplica para
// este modo). Un curso puede tener también contenido ASINCRONO_VOD
// (Coursera) por separado.
//
// Estructura de página completa (no una columna angosta): barra de
// pestañas "Curso / Calificaciones" pegada al header, banner del curso con
// tarjeta del profesor, y debajo pestañas horizontales por módulo (cada
// módulo es su propia pestaña, no un acordeón como en Coursera). El botón
// de regreso siempre vuelve a "Mis cursos" de Moodle, no al Área Personal.

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import VideoPlayer from '@components/VideoPlayer';
import QuizRunner from '@components/QuizRunner';
import EntregaTarea from '@components/EntregaTarea';
import MoodleHeader from '@layout/MoodleHeader';
import MoodleFooter from '@layout/MoodleFooter';
import './CursoTradicional.css';

const ESTADO_LABEL = { NOT_STARTED: 'Por hacer', IN_PROGRESS: 'En curso', COMPLETED: 'Completado' };
const SECCIONES = [
  { tipo: 'VIDEO', titulo: 'Videos', icono: 'fa-circle-play' },
  { tipo: 'DOCUMENT', titulo: 'Recursos', icono: 'fa-file-lines' },
  { tipo: 'ASSIGNMENT', titulo: 'Actividades', icono: 'fa-file-pen' },
  { tipo: 'QUIZ', titulo: 'Examen', icono: 'fa-list-check' },
];

const CursoTradicional = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const itemDesdeUrl = searchParams.get('item');
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('curso');
  const [moduloActivo, setModuloActivo] = useState(null);
  const [activeItemId, setActiveItemId] = useState(itemDesdeUrl);

  const cargar = useCallback(() => {
    lmsService.getCursoDetalle(courseId, 'TRADICIONAL')
      .then((data) => {
        setDetalle(data);
        setModuloActivo((actual) => actual ?? data.modules[0]?.id ?? null);
      })
      .catch(() => setError('No se pudo cargar el curso, o no estás inscrito en él.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Si se entró con ?item=... (ej. desde el calendario o la línea de tiempo),
  // abre directo ese contenido en su módulo.
  useEffect(() => {
    if (!itemDesdeUrl || !detalle) return;
    const modulo = detalle.modules.find((m) => m.content_items.some((i) => i.id === itemDesdeUrl));
    if (modulo) {
      setModuloActivo(modulo.id);
      setActiveItemId(itemDesdeUrl);
      setTab('curso');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalle]);

  if (error) {
    return (
      <div className="ctw-shell">
        <MoodleHeader />
        <div className="ctw-main"><p className="lms-error">{error}</p></div>
        <MoodleFooter />
      </div>
    );
  }
  if (!detalle) {
    return (
      <div className="ctw-shell">
        <MoodleHeader />
        <div className="ctw-main"><p>Cargando…</p></div>
        <MoodleFooter />
      </div>
    );
  }

  const todosLosItems = detalle.modules.flatMap((m) => m.content_items.map((i) => ({ ...i, modulo: m.titulo })));
  const tareas = todosLosItems.filter((i) => i.item_type === 'ASSIGNMENT' || i.item_type === 'QUIZ');
  const totalItems = todosLosItems.length;
  const completados = todosLosItems.filter((i) => i.status === 'COMPLETED').length;
  const pctCompletado = totalItems === 0 ? 0 : Math.round((completados / totalItems) * 100);

  const moduloObj = detalle.modules.find((m) => m.id === moduloActivo);
  const profesor = detalle.course.profesor;
  const iniciales = profesor ? (profesor.nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() : '';

  return (
    <div className="ctw-shell">
      <MoodleHeader />

      <nav className="ctw-tabbar">
        <Link to="/moodle/mis-cursos" className="ctw-tabbar-icon" title="Mis cursos"><i className="fa-solid fa-chalkboard-user" /></Link>
        <button className={`ctw-tab ${tab === 'curso' ? 'is-active' : ''}`} onClick={() => setTab('curso')}>Curso</button>
        <button className={`ctw-tab ${tab === 'notas' ? 'is-active' : ''}`} onClick={() => setTab('notas')}>Calificaciones</button>
      </nav>

      <div className="ctw-banner">
        <Link to="/moodle/mis-cursos" className="ctw-volver" title="Volver a Mis cursos"><i className="fa-solid fa-arrow-left" /></Link>
        <h1>{detalle.course.titulo}</h1>
        <p className="ctw-progreso-texto">{pctCompletado}% completado — {completados} de {totalItems}</p>
        {profesor && (
          <div className="ctw-profesor-card">
            <span className="ctw-profesor-avatar">{iniciales}</span>
            <strong>{profesor.nombre}</strong>
            <small>{profesor.correo}</small>
          </div>
        )}
      </div>

      <main className="ctw-main">
        {tab === 'curso' && (
          <>
            <div className="ctw-modtabs">
              {detalle.modules.map((m, i) => (
                <button
                  key={m.id}
                  className={`ctw-modtab ${moduloActivo === m.id ? 'is-active' : ''}`}
                  onClick={() => setModuloActivo(m.id)}
                >
                  Módulo {i + 1}
                </button>
              ))}
              {detalle.modules.length === 0 && <p className="lms-empty">Todavía no hay módulos publicados.</p>}
            </div>

            {moduloObj && (
              <div className="ctw-mod-contenido">
                <h2 className="ctw-mod-titulo">{moduloObj.titulo}</h2>
                {moduloObj.descripcion && <p className="ctw-mod-intro">{moduloObj.descripcion}</p>}

                {SECCIONES.map(({ tipo, titulo, icono }) => {
                  const items = moduloObj.content_items.filter((i) => i.item_type === tipo);
                  if (items.length === 0) return null;
                  return (
                    <div key={tipo} className="ctw-seccion">
                      <h3><i className={`fa-solid ${icono}`} /> {titulo}</h3>
                      <ul>
                        {items.map((item) => (
                          <li key={item.id}>
                            <button
                              className={`ct-item-btn ${item.id === activeItemId ? 'is-active' : ''} ${item.status === 'COMPLETED' ? 'is-done' : ''}`}
                              onClick={() => setActiveItemId((actual) => (actual === item.id ? null : item.id))}
                            >
                              <i className={`fa-solid ${icono}`} />
                              <span>{item.titulo}</span>
                              {item.status === 'COMPLETED' && <i className="fa-solid fa-circle-check ct-check" />}
                            </button>

                            {item.id === activeItemId && (
                              <div className="ctw-item-contenido">
                                {item.item_type === 'VIDEO' && (
                                  <VideoPlayer contentItem={item} onProgressUpdate={(r) => r.just_completed && cargar()} />
                                )}
                                {item.item_type === 'DOCUMENT' && (
                                  <div className="lms-document">
                                    {item.body_text && <p className="cv-lectura-texto">{item.body_text}</p>}
                                    <button
                                      className="lms-btn-primary"
                                      disabled={item.status === 'COMPLETED'}
                                      onClick={async () => { await lmsService.marcarDocumentoLeido(item.id); cargar(); }}
                                    >
                                      {item.status === 'COMPLETED' ? 'Ya marcado como leído' : 'Marcar como leído'}
                                    </button>
                                  </div>
                                )}
                                {item.item_type === 'QUIZ' && <QuizRunner contentItem={item} onCompleted={cargar} />}
                                {item.item_type === 'ASSIGNMENT' && <EntregaTarea contentItem={item} />}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'notas' && (
          <div className="ct-notas">
            <table>
              <thead><tr><th>Actividad</th><th>Módulo</th><th>Nota</th><th>Estado</th></tr></thead>
              <tbody>
                {tareas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.titulo}</td>
                    <td>{t.modulo}</td>
                    <td className="ct-nota-cell">{t.grade ? t.grade.score : <span className="ct-dash">—</span>}</td>
                    <td><span className={`ct-pill ${t.status === 'COMPLETED' ? 'is-ok' : ''}`}>{ESTADO_LABEL[t.status]}</span></td>
                  </tr>
                ))}
                {tareas.length === 0 && <tr><td colSpan={4} className="lms-empty">Sin actividades calificables todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <MoodleFooter />
    </div>
  );
};

export default CursoTradicional;
