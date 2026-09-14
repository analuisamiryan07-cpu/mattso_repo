// Vista "Moodle": acceso abierto a todos los recursos y tareas del curso —
// sin candados secuenciales (courses.service.ts ya no los aplica para
// delivery_mode='TRADICIONAL', ver el comentario ahí). Tres pestañas:
// Recursos (ver/leer), Tareas (entregar/rendir), Mis calificaciones.

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import VideoPlayer from '@components/VideoPlayer';
import QuizRunner from '@components/QuizRunner';
import EntregaTarea from '@components/EntregaTarea';
import './CursoTradicional.css';

const ESTADO_LABEL = { NOT_STARTED: 'Por hacer', IN_PROGRESS: 'En curso', COMPLETED: 'Completado' };

const CursoTradicional = () => {
  const { courseId } = useParams();
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('recursos');
  const [activeItemId, setActiveItemId] = useState(null);

  const cargar = useCallback(() => {
    lmsService.getCursoDetalle(courseId)
      .then(setDetalle)
      .catch(() => setError('No se pudo cargar el curso, o no estás inscrito en él.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => { cargar(); }, [cargar]);

  if (error) return <div className="lms-page"><p className="lms-error">{error}</p></div>;
  if (!detalle) return <div className="lms-page"><p>Cargando…</p></div>;

  const todosLosItems = detalle.modules.flatMap((m) => m.content_items.map((i) => ({ ...i, modulo: m.titulo })));
  const recursos = todosLosItems.filter((i) => i.item_type === 'VIDEO' || i.item_type === 'DOCUMENT');
  const tareas = todosLosItems.filter((i) => i.item_type === 'ASSIGNMENT' || i.item_type === 'QUIZ');
  const activeItem = todosLosItems.find((i) => i.id === activeItemId);

  const abrir = (item) => { setActiveItemId(item.id); setTab(item.item_type === 'VIDEO' || item.item_type === 'DOCUMENT' ? 'recursos' : 'tareas'); };

  return (
    <div className="lms-page">
      <h1 className="lms-page-title">{detalle.course.titulo}</h1>

      <div className="ct-subtabs">
        <button className={`ct-subtab ${tab === 'recursos' ? 'is-active' : ''}`} onClick={() => setTab('recursos')}>Recursos</button>
        <button className={`ct-subtab ${tab === 'tareas' ? 'is-active' : ''}`} onClick={() => setTab('tareas')}>Tareas</button>
        <button className={`ct-subtab ${tab === 'notas' ? 'is-active' : ''}`} onClick={() => setTab('notas')}>Mis calificaciones</button>
      </div>

      {tab === 'recursos' && (
        <div className="ct-layout">
          <ul className="ct-item-list">
            {recursos.map((item) => (
              <li key={item.id}>
                <button className={`ct-item-btn ${item.id === activeItemId ? 'is-active' : ''} ${item.status === 'COMPLETED' ? 'is-done' : ''}`} onClick={() => abrir(item)}>
                  <i className={`fa-solid ${item.item_type === 'VIDEO' ? 'fa-circle-play' : 'fa-file-lines'}`} />
                  <span>{item.titulo}</span>
                  {item.status === 'COMPLETED' && <i className="fa-solid fa-circle-check ct-check" />}
                </button>
              </li>
            ))}
            {recursos.length === 0 && <p className="lms-empty">Todavía no hay recursos publicados.</p>}
          </ul>
          <div className="ct-content">
            {!activeItem && <p className="lms-empty">Selecciona un recurso de la lista.</p>}
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
          </div>
        </div>
      )}

      {tab === 'tareas' && (
        <div className="ct-layout">
          <ul className="ct-item-list">
            {tareas.map((item) => (
              <li key={item.id}>
                <button className={`ct-item-btn ${item.id === activeItemId ? 'is-active' : ''} ${item.status === 'COMPLETED' ? 'is-done' : ''}`} onClick={() => abrir(item)}>
                  <i className={`fa-solid ${item.item_type === 'QUIZ' ? 'fa-list-check' : 'fa-file-pen'}`} />
                  <span>{item.titulo}</span>
                  <span className="ct-estado-tag">{ESTADO_LABEL[item.status]}</span>
                </button>
              </li>
            ))}
            {tareas.length === 0 && <p className="lms-empty">Todavía no hay tareas asignadas.</p>}
          </ul>
          <div className="ct-content">
            {!activeItem && <p className="lms-empty">Selecciona una tarea de la lista.</p>}
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
  );
};

export default CursoTradicional;
