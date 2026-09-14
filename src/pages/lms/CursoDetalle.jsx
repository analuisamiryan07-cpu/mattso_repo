//
// El árbol de módulos/contenido con `unlocked`/`status` viene ya calculado
// del backend (courses.service.ts) — este componente solo lo pinta. Nunca
// decide por su cuenta si algo está desbloqueado (regla de arquitectura §7).

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import VideoPlayer from '@components/lms/VideoPlayer';
import QuizRunner from '@components/lms/QuizRunner';
import EntregaTarea from '@components/lms/EntregaTarea';
import './CursoDetalle.css';

const ICONS = { VIDEO: 'fa-circle-play', ASSIGNMENT: 'fa-file-pen', QUIZ: 'fa-list-check', DOCUMENT: 'fa-file-lines' };

const CursoDetalle = () => {
  const { courseId } = useParams();
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);

  const cargar = useCallback(() => {
    lmsService
      .getCursoDetalle(courseId)
      .then((data) => {
        setDetalle(data);
        if (!activeItemId) {
          const firstUnlocked = data.modules.flatMap((m) => m.content_items).find((i) => i.unlocked);
          setActiveItemId(firstUnlocked?.id ?? null);
        }
      })
      .catch(() => setError('No se pudo cargar el curso, o no estás inscrito en él.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) return <div className="lms-page"><p className="lms-error">{error}</p></div>;
  if (!detalle) return <div className="lms-page"><p>Cargando…</p></div>;

  const activeItem = detalle.modules.flatMap((m) => m.content_items).find((i) => i.id === activeItemId);

  return (
    <div className="lms-page lms-curso-detalle">
      <h1 className="lms-page-title">{detalle.course.titulo}</h1>
      <div className="lms-curso-layout">
        <aside className="lms-curso-nav">
          {detalle.modules.map((mod) => (
            <div key={mod.id} className={`lms-mod ${mod.unlocked ? '' : 'is-locked'}`}>
              <p className="lms-mod-title">
                {!mod.unlocked && <i className="fa-solid fa-lock" />}
                {mod.titulo}
              </p>
              <ul className="lms-mod-items">
                {mod.content_items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={[
                        'lms-item-btn',
                        item.id === activeItemId ? 'is-active' : '',
                        item.status === 'COMPLETED' ? 'is-completed' : '',
                        !item.unlocked ? 'is-locked' : '',
                      ].join(' ').trim()}
                      disabled={!item.unlocked}
                      onClick={() => setActiveItemId(item.id)}
                    >
                      <i className={`fa-solid ${!item.unlocked ? 'fa-lock' : item.status === 'COMPLETED' ? 'fa-circle-check' : ICONS[item.item_type]}`} />
                      <span>{item.titulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <main className="lms-curso-content">
          {!activeItem && <p className="lms-empty">Selecciona un contenido del menú.</p>}
          {activeItem?.item_type === 'VIDEO' && (
            <VideoPlayer contentItem={activeItem} onProgressUpdate={(r) => r.just_completed && cargar()} />
          )}
          {activeItem?.item_type === 'QUIZ' && (
            <QuizRunner contentItem={activeItem} onCompleted={cargar} />
          )}
          {activeItem?.item_type === 'ASSIGNMENT' && (
            <EntregaTarea contentItem={activeItem} />
          )}
          {activeItem?.item_type === 'DOCUMENT' && (
            <div className="lms-document">
              <p>{activeItem.titulo}</p>
              <button
                className="lms-btn-primary"
                disabled={activeItem.status === 'COMPLETED'}
                onClick={async () => {
                  await lmsService.marcarDocumentoLeido(activeItem.id);
                  cargar();
                }}
              >
                {activeItem.status === 'COMPLETED' ? 'Ya marcado como leído' : 'Marcar como leído'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CursoDetalle;
