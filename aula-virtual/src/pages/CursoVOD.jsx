// Vista "Coursera": tarjetas de módulo que se despliegan (en vez del menú
// lateral de antes). Cada módulo, al abrirse, muestra en orden fijo: texto
// de qué se va a aprender (module.descripcion) -> Videos -> Lecturas
// (DOCUMENT) -> Tareas (ASSIGNMENT) -> Examen (QUIZ) — agrupado por tipo
// para la vista, el desbloqueo secuencial real sigue viniendo ya resuelto
// del backend (courses.service.ts), esto solo reordena cómo se pinta.
// Arriba, portada del curso (imagen + descripción) usando la misma
// convención de Cloudinary que el resto del sitio (Cursos/{folder}/...).

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import VideoPlayer from '@components/VideoPlayer';
import QuizRunner from '@components/QuizRunner';
import EntregaTarea from '@components/EntregaTarea';
import AulaHeader from '@layout/AulaHeader';
import AulaFooter from '@layout/AulaFooter';
import BackButton from '@layout/BackButton';
import './CursoVOD.css';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/ehglt8h8/image/upload';

const SECCIONES = [
  { tipo: 'VIDEO', titulo: 'Videos', icono: 'fa-circle-play' },
  { tipo: 'DOCUMENT', titulo: 'Lecturas', icono: 'fa-file-lines' },
  { tipo: 'ASSIGNMENT', titulo: 'Tareas', icono: 'fa-file-pen' },
  { tipo: 'QUIZ', titulo: 'Examen', icono: 'fa-list-check' },
];

const CursoVOD = () => {
  const { courseId } = useParams();
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [moduloAbierto, setModuloAbierto] = useState(null);

  const cargar = useCallback(() => {
    lmsService
      .getCursoDetalle(courseId, 'ASINCRONO_VOD')
      .then((data) => {
        setDetalle(data);
        setModuloAbierto((actual) => actual ?? data.modules[0]?.id ?? null);
      })
      .catch(() => setError('No se pudo cargar el curso, o no estás inscrito en él.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => { cargar(); }, [cargar]);

  if (error) {
    return (
      <div className="lms-shell">
        <AulaHeader variant="area" />
        <div className="lms-page"><p className="lms-error">{error}</p></div>
        <AulaFooter />
      </div>
    );
  }
  if (!detalle) {
    return (
      <div className="lms-shell">
        <AulaHeader variant="area" />
        <div className="lms-page"><p>Cargando…</p></div>
        <AulaFooter />
      </div>
    );
  }

  const abrirItem = (item) => setActiveItemId((actual) => (actual === item.id ? null : item.id));
  const folder = detalle.course.cloudinary_folder;

  return (
    <div className="lms-shell">
      <AulaHeader variant="area" />
      <div className="lms-page lms-curso-detalle">
        <BackButton to="/coursera" label="Volver a Coursera" />

        <div className="cv-portada">
          {folder && (
            <img src={`${CLOUDINARY_BASE}/${folder}/hero`} alt={detalle.course.titulo} className="cv-portada-img" />
          )}
          <div className="cv-portada-texto">
            <h1 className="lms-page-title">{detalle.course.titulo}</h1>
            {detalle.course.descripcion && <p>{detalle.course.descripcion}</p>}
          </div>
        </div>

        <div className="cv-modulos">
          {detalle.modules.map((mod, i) => (
            <ModuloCard
              key={mod.id}
              numero={i + 1}
              modulo={mod}
              abierto={moduloAbierto === mod.id}
              onToggle={() => setModuloAbierto((actual) => (actual === mod.id ? null : mod.id))}
              activeItemId={activeItemId}
              onAbrirItem={abrirItem}
              onProgreso={cargar}
            />
          ))}
        </div>
      </div>
      <AulaFooter />
    </div>
  );
};

const ModuloCard = ({ numero, modulo, abierto, onToggle, activeItemId, onAbrirItem, onProgreso }) => {
  const porTipo = (tipo) => modulo.content_items.filter((i) => i.item_type === tipo);

  return (
    <div className={`cv-mod-card ${modulo.unlocked ? '' : 'is-locked'}`}>
      <button className="cv-mod-header" onClick={onToggle}>
        <span className="cv-mod-numero">{modulo.unlocked ? numero : <i className="fa-solid fa-lock" />}</span>
        <span className="cv-mod-titulo">Módulo {numero}: {modulo.titulo}</span>
        <i className={`fa-solid fa-chevron-${abierto ? 'up' : 'down'} cv-mod-caret`} />
      </button>

      {abierto && (
        <div className="cv-mod-body">
          {modulo.descripcion && <p className="cv-mod-intro">{modulo.descripcion}</p>}
          {!modulo.unlocked && (
            <p className="cv-mod-bloqueado"><i className="fa-solid fa-lock" /> Completa el módulo anterior para desbloquear este.</p>
          )}

          {SECCIONES.map(({ tipo, titulo, icono }) => {
            const items = porTipo(tipo);
            if (items.length === 0) return null;
            return (
              <div key={tipo} className="cv-mod-seccion">
                <h3><i className={`fa-solid ${icono}`} /> {titulo}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        className={[
                          'cv-item-btn',
                          item.id === activeItemId ? 'is-active' : '',
                          item.status === 'COMPLETED' ? 'is-completed' : '',
                          !item.unlocked ? 'is-locked' : '',
                        ].join(' ').trim()}
                        disabled={!item.unlocked}
                        onClick={() => onAbrirItem(item)}
                      >
                        <i className={`fa-solid ${!item.unlocked ? 'fa-lock' : item.status === 'COMPLETED' ? 'fa-circle-check' : icono}`} />
                        <span>{item.titulo}</span>
                      </button>

                      {item.id === activeItemId && (
                        <div className="cv-item-contenido">
                          {item.item_type === 'VIDEO' && (
                            <VideoPlayer contentItem={item} onProgressUpdate={(r) => r.just_completed && onProgreso()} />
                          )}
                          {item.item_type === 'QUIZ' && (
                            <QuizRunner contentItem={item} onCompleted={onProgreso} />
                          )}
                          {item.item_type === 'ASSIGNMENT' && (
                            <EntregaTarea contentItem={item} />
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
    </div>
  );
};

export default CursoVOD;
