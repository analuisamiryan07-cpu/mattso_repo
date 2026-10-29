// Vista "Moodle": acceso abierto a todo el contenido TRADICIONAL de un
// curso — sin candados secuenciales (courses.service.ts no los aplica para
// este modo). Un curso puede tener también contenido ASINCRONO_VOD
// (Coursera) por separado.
//
// Calcado de la referencia real que envió la usuaria: barra "Curso /
// Participantes / Calificaciones" pegada al header, banner con textura +
// tarjeta del profesor, pestañas "General + un módulo por pestaña", y
// dentro de cada módulo secciones "Actividades" / "Recursos" con tarjetas.
// Se deja fuera la pestaña "Competencias" y el nivel "Criterio" dentro de
// cada módulo porque no hay ningún dato real detrás de esos dos — nuestro
// modelo es Module -> ContentItem, sin una subdivisión más entre medio.

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
const ICONOS = { VIDEO: 'fa-circle-play', DOCUMENT: 'fa-file-lines', ASSIGNMENT: 'fa-file-pen', QUIZ: 'fa-list-check' };
const ETIQUETAS = { VIDEO: 'Video', DOCUMENT: 'Lectura', ASSIGNMENT: 'Tarea', QUIZ: 'Examen' };

const CursoTradicional = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const itemDesdeUrl = searchParams.get('item');
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('curso');
  const [moduloActivo, setModuloActivo] = useState('general');
  const [activeItemId, setActiveItemId] = useState(itemDesdeUrl);

  const cargar = useCallback(() => {
    lmsService.getCursoDetalle(courseId, 'TRADICIONAL')
      .then(setDetalle)
      .catch(() => setError('No se pudo cargar el curso, o no estás inscrito en él.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => { cargar(); }, [cargar]);

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

  const moduloObj = moduloActivo === 'general' ? null : detalle.modules.find((m) => m.id === moduloActivo);
  const profesor = detalle.course.profesor;
  const iniciales = profesor ? (profesor.nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() : '';

  const irAItem = (item, moduloId) => {
    setModuloActivo(moduloId);
    setActiveItemId(item.id);
  };

  return (
    <div className="ctw-shell">
      <MoodleHeader />

      <nav className="ctw-tabbar">
        <Link to="/moodle/mis-cursos" className="ctw-tabbar-icon" title="Mis cursos"><i className="fa-solid fa-chalkboard-user" /></Link>
        <button className={`ctw-tab ${tab === 'curso' ? 'is-active' : ''}`} onClick={() => setTab('curso')}>Curso</button>
        <button className={`ctw-tab ${tab === 'participantes' ? 'is-active' : ''}`} onClick={() => setTab('participantes')}>Participantes</button>
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

      <main className={`ctw-main ${profesor ? 'ctw-main--con-profesor' : ''}`}>
        {tab === 'curso' && (
          <>
            <div className="ctw-modtabs">
              <button className={`ctw-modtab ${moduloActivo === 'general' ? 'is-active' : ''}`} onClick={() => setModuloActivo('general')}>General</button>
              {detalle.modules.map((m, i) => (
                <button
                  key={m.id}
                  className={`ctw-modtab ${moduloActivo === m.id ? 'is-active' : ''}`}
                  onClick={() => setModuloActivo(m.id)}
                >
                  Módulo {i + 1}
                </button>
              ))}
            </div>

            {moduloActivo === 'general' ? (
              <GeneralTab detalle={detalle} onAbrirItem={irAItem} />
            ) : moduloObj ? (
              <ModuloContenido
                modulo={moduloObj}
                activeItemId={activeItemId}
                onAbrirItem={(item) => setActiveItemId((actual) => (actual === item.id ? null : item.id))}
                onProgreso={cargar}
              />
            ) : (
              <p className="lms-empty">Este módulo ya no está disponible.</p>
            )}
          </>
        )}

        {tab === 'participantes' && <ParticipantesTab courseId={courseId} />}

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

// "General": sin dato de curso-wide (foros, etc. no existen en nuestro
// modelo) — se muestra la descripción del curso + todo el contenido de
// todos los módulos, como accesos directos.
const GeneralTab = ({ detalle, onAbrirItem }) => {
  const todos = detalle.modules.flatMap((m) => m.content_items.map((i) => ({ ...i, moduloId: m.id })));
  return (
    <div className="ctw-general">
      {detalle.course.descripcion && <p className="ctw-mod-intro">{detalle.course.descripcion}</p>}
      {todos.length === 0 && <p className="lms-empty">Todavía no hay contenido publicado en este curso.</p>}
      <ul className="ctw-tarjetas">
        {todos.map((item) => (
          <li key={item.id}>
            <button className="ctw-tarjeta" onClick={() => onAbrirItem(item, item.moduloId)}>
              <span className={`ctw-tarjeta-icono ctw-tarjeta-icono--${item.item_type === 'VIDEO' || item.item_type === 'DOCUMENT' ? 'recurso' : 'actividad'}`}>
                <i className={`fa-solid ${ICONOS[item.item_type]}`} />
              </span>
              <span className="ctw-tarjeta-texto">
                <small>{ETIQUETAS[item.item_type]}</small>
                <strong>{item.titulo}</strong>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ModuloContenido = ({ modulo, activeItemId, onAbrirItem, onProgreso }) => {
  const actividades = modulo.content_items.filter((i) => i.item_type === 'ASSIGNMENT' || i.item_type === 'QUIZ');
  const recursos = modulo.content_items.filter((i) => i.item_type === 'VIDEO' || i.item_type === 'DOCUMENT');

  return (
    <div className="ctw-mod-contenido">
      <div className="ctw-mod-banner"><i className="fa-solid fa-thumbtack" /> <strong>{modulo.titulo}</strong>{modulo.descripcion && `: ${modulo.descripcion}`}</div>

      {actividades.length > 0 && (
        <>
          <div className="ctw-seccion-banner">ACTIVIDADES</div>
          <ul className="ctw-tarjetas">
            {actividades.map((item) => (
              <TarjetaItem key={item.id} item={item} activo={item.id === activeItemId} onAbrirItem={onAbrirItem} onProgreso={onProgreso} />
            ))}
          </ul>
        </>
      )}

      {recursos.length > 0 && (
        <>
          <div className="ctw-seccion-banner">RECURSOS</div>
          <ul className="ctw-tarjetas">
            {recursos.map((item) => (
              <TarjetaItem key={item.id} item={item} activo={item.id === activeItemId} onAbrirItem={onAbrirItem} onProgreso={onProgreso} />
            ))}
          </ul>
        </>
      )}

      {actividades.length === 0 && recursos.length === 0 && (
        <p className="lms-empty">Este módulo todavía no tiene contenido publicado.</p>
      )}
    </div>
  );
};

const TarjetaItem = ({ item, activo, onAbrirItem, onProgreso }) => (
  <li>
    <button className={`ctw-tarjeta ${activo ? 'is-active' : ''} ${item.status === 'COMPLETED' ? 'is-done' : ''}`} onClick={() => onAbrirItem(item)}>
      <span className={`ctw-tarjeta-icono ctw-tarjeta-icono--${item.item_type === 'VIDEO' || item.item_type === 'DOCUMENT' ? 'recurso' : 'actividad'}`}>
        <i className={`fa-solid ${item.status === 'COMPLETED' ? 'fa-circle-check' : ICONOS[item.item_type]}`} />
      </span>
      <span className="ctw-tarjeta-texto">
        <small>{ETIQUETAS[item.item_type]}</small>
        <strong>{item.titulo}</strong>
      </span>
    </button>

    {activo && (
      <div className="ctw-item-contenido">
        {item.item_type === 'VIDEO' && (
          <VideoPlayer contentItem={item} onProgressUpdate={(r) => r.just_completed && onProgreso()} />
        )}
        {item.item_type === 'DOCUMENT' && (
          <div className="lms-document">
            {item.body_text && <p className="cv-lectura-texto">{item.body_text}</p>}
            <button
              className="lms-btn-primary"
              disabled={item.status === 'COMPLETED'}
              onClick={async () => { await lmsService.marcarDocumentoLeido(item.id); onProgreso(); }}
            >
              {item.status === 'COMPLETED' ? 'Ya marcado como leído' : 'Marcar como leído'}
            </button>
          </div>
        )}
        {item.item_type === 'QUIZ' && <QuizRunner contentItem={item} onCompleted={onProgreso} />}
        {item.item_type === 'ASSIGNMENT' && <EntregaTarea contentItem={item} />}
      </div>
    )}
  </li>
);

const ParticipantesTab = ({ courseId }) => {
  const [participantes, setParticipantes] = useState(null);

  useEffect(() => {
    lmsService.getParticipantes(courseId).then(setParticipantes).catch(() => setParticipantes([]));
  }, [courseId]);

  return (
    <div className="ctw-participantes">
      {participantes === null && <p>Cargando…</p>}
      {participantes?.length === 0 && <p className="lms-empty">No hay otros estudiantes inscritos todavía.</p>}
      <ul className="ctw-participantes-lista">
        {participantes?.map((p) => (
          <li key={p.id} className={p.soy_yo ? 'es-yo' : ''}>
            <span className="ctw-participante-avatar">{(p.nombre || '?')[0]}</span>
            <div>
              <strong>{p.nombre}{p.soy_yo ? ' (tú)' : ''}</strong>
              {p.correo && <small>{p.correo}</small>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CursoTradicional;
