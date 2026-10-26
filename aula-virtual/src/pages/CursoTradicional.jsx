// Vista "Moodle": acceso abierto a todo el contenido TRADICIONAL de un
// curso — sin candados secuenciales (courses.service.ts no los aplica para
// este modo). Un curso puede tener también contenido ASINCRONO_VOD
// (Coursera) por separado. Tres pestañas: Área personal (resumen de este
// curso), Curso (todo el contenido, ver/leer/entregar/rendir),
// Calificaciones.

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import VideoPlayer from '@components/VideoPlayer';
import QuizRunner from '@components/QuizRunner';
import EntregaTarea from '@components/EntregaTarea';
import MoodleHeader from '@layout/MoodleHeader';
import MoodleFooter from '@layout/MoodleFooter';
import BackButton from '@layout/BackButton';
import './CursoTradicional.css';

const ESTADO_LABEL = { NOT_STARTED: 'Por hacer', IN_PROGRESS: 'En curso', COMPLETED: 'Completado' };

const CursoTradicional = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const itemDesdeUrl = searchParams.get('item');
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('area-personal');
  const [activeItemId, setActiveItemId] = useState(itemDesdeUrl);

  const cargar = useCallback(() => {
    lmsService.getCursoDetalle(courseId, 'TRADICIONAL')
      .then(setDetalle)
      .catch(() => setError('No se pudo cargar el curso, o no estás inscrito en él.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Si se entró con ?item=... (ej. desde el calendario o la línea de tiempo),
  // abre directo ese contenido en la pestaña que le corresponde.
  useEffect(() => {
    if (!itemDesdeUrl || !detalle) return;
    const item = detalle.modules.flatMap((m) => m.content_items).find((i) => i.id === itemDesdeUrl);
    if (item) {
      setActiveItemId(item.id);
      setTab('curso');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalle]);

  if (error) {
    return (
      <div className="lms-shell">
        <MoodleHeader />
        <div className="lms-page"><p className="lms-error">{error}</p></div>
        <MoodleFooter />
      </div>
    );
  }
  if (!detalle) {
    return (
      <div className="lms-shell">
        <MoodleHeader />
        <div className="lms-page"><p>Cargando…</p></div>
        <MoodleFooter />
      </div>
    );
  }

  const todosLosItems = detalle.modules.flatMap((m) => m.content_items.map((i) => ({ ...i, modulo: m.titulo })));
  const tareas = todosLosItems.filter((i) => i.item_type === 'ASSIGNMENT' || i.item_type === 'QUIZ');
  const activeItem = todosLosItems.find((i) => i.id === activeItemId);

  const abrir = (item) => { setActiveItemId(item.id); setTab('curso'); };

  const totalItems = todosLosItems.length;
  const completados = todosLosItems.filter((i) => i.status === 'COMPLETED').length;
  const pctCompletado = totalItems === 0 ? 0 : Math.round((completados / totalItems) * 100);
  const pendientes = todosLosItems.filter((i) => i.status !== 'COMPLETED');

  return (
    <div className="lms-shell">
      <MoodleHeader />
      <div className="lms-page">
      <BackButton to="/moodle" label="Volver a Moodle" />
      <h1 className="lms-page-title">{detalle.course.titulo}</h1>

      <div className="ct-subtabs">
        <button className={`ct-subtab ${tab === 'area-personal' ? 'is-active' : ''}`} onClick={() => setTab('area-personal')}>Área personal</button>
        <button className={`ct-subtab ${tab === 'curso' ? 'is-active' : ''}`} onClick={() => setTab('curso')}>Curso</button>
        <button className={`ct-subtab ${tab === 'notas' ? 'is-active' : ''}`} onClick={() => setTab('notas')}>Calificaciones</button>
      </div>

      {tab === 'area-personal' && (
        <div className="ct-area-personal">
          <div className="ct-progreso-card">
            <div className="ct-progreso-aro" style={{ '--pct': pctCompletado }}>
              <span>{pctCompletado}%</span>
            </div>
            <div>
              <strong>{completados} de {totalItems} completados</strong>
              <p>Progreso en este curso</p>
            </div>
          </div>

          <h3 className="ct-area-personal-subtitulo">Pendientes en este curso</h3>
          <ul className="ct-pendientes-lista">
            {pendientes.map((item) => (
              <li key={item.id}>
                <button onClick={() => abrir(item)}>
                  <i className={`fa-solid ${item.item_type === 'VIDEO' ? 'fa-circle-play' : item.item_type === 'DOCUMENT' ? 'fa-file-lines' : item.item_type === 'QUIZ' ? 'fa-list-check' : 'fa-file-pen'}`} />
                  <span>{item.titulo}</span>
                  <small>{item.modulo}</small>
                </button>
              </li>
            ))}
            {pendientes.length === 0 && <p className="lms-empty">No tienes nada pendiente en este curso.</p>}
          </ul>
        </div>
      )}

      {tab === 'curso' && (
        <div className="ct-layout">
          <ul className="ct-item-list">
            {todosLosItems.map((item) => (
              <li key={item.id}>
                <button className={`ct-item-btn ${item.id === activeItemId ? 'is-active' : ''} ${item.status === 'COMPLETED' ? 'is-done' : ''}`} onClick={() => abrir(item)}>
                  <i className={`fa-solid ${item.item_type === 'VIDEO' ? 'fa-circle-play' : item.item_type === 'DOCUMENT' ? 'fa-file-lines' : item.item_type === 'QUIZ' ? 'fa-list-check' : 'fa-file-pen'}`} />
                  <span>{item.titulo}</span>
                  {item.status === 'COMPLETED' && <i className="fa-solid fa-circle-check ct-check" />}
                </button>
              </li>
            ))}
            {todosLosItems.length === 0 && <p className="lms-empty">Todavía no hay contenido publicado.</p>}
          </ul>
          <div className="ct-content">
            {!activeItem && <p className="lms-empty">Selecciona un contenido de la lista.</p>}
            {activeItem?.item_type === 'VIDEO' && (
              <VideoPlayer contentItem={activeItem} onProgressUpdate={(r) => r.just_completed && cargar()} />
            )}
            {activeItem?.item_type === 'DOCUMENT' && (
              <div className="lms-document">
                <p>{activeItem.titulo}</p>
                <button
                  className="lms-btn-primary"
                  disabled={activeItem.status === 'COMPLETED'}
                  onClick={async () => { await lmsService.marcarDocumentoLeido(activeItem.id); cargar(); }}
                >
                  {activeItem.status === 'COMPLETED' ? 'Ya marcado como leído' : 'Marcar como leído'}
                </button>
              </div>
            )}
            {activeItem?.item_type === 'QUIZ' && <QuizRunner contentItem={activeItem} onCompleted={cargar} />}
            {activeItem?.item_type === 'ASSIGNMENT' && <EntregaTarea contentItem={activeItem} />}
          </div>
        </div>
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
      </div>
      <MoodleFooter />
    </div>
  );
};

export default CursoTradicional;
