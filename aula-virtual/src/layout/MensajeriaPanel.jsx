// Panel lateral de mensajería estudiante -> profesor (solo Moodle). Primero
// elige con qué profesor hablar (uno por curso Moodle vigente con profesor
// asignado), luego ve/envía mensajes de esa conversación. No hay bandeja de
// respuesta del profesor todavía — eso es una fase posterior, ya acordada.

import { useEffect, useRef, useState } from 'react';
import { lmsService } from '@api/lmsService';
import { useIdioma } from '@context/IdiomaContext';
import './MensajeriaPanel.css';

const MensajeriaPanel = ({ onClose }) => {
  const { t } = useIdioma();
  const [profesores, setProfesores] = useState(null);
  const [cursoActivo, setCursoActivo] = useState(null); // { course_id, profesor_nombre, course_titulo }
  const panelRef = useRef(null);

  useEffect(() => {
    lmsService.getProfesoresParaMensajear().then(setProfesores).catch(() => setProfesores([]));
  }, []);

  useEffect(() => {
    const cerrarSiFueraDelPanel = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', cerrarSiFueraDelPanel);
    return () => document.removeEventListener('mousedown', cerrarSiFueraDelPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mj-panel" ref={panelRef}>
      <div className="mj-panel-header">
        <h3>{cursoActivo ? cursoActivo.profesor_nombre : t('mensajes')}</h3>
        <button className="mj-cerrar" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
      </div>

      {!cursoActivo ? (
        <div className="mj-lista-profesores">
          <p className="mj-subtitulo">{t('elegirProfesor')}</p>
          {profesores === null && <p className="mj-vacio">Cargando…</p>}
          {profesores?.length === 0 && <p className="mj-vacio">No tienes cursos Moodle con profesor asignado.</p>}
          {profesores?.map((p) => (
            <button key={p.course_id} className="mj-profesor-item" onClick={() => setCursoActivo(p)}>
              <span className="mj-profesor-avatar">{(p.profesor_nombre || '?')[0]}</span>
              <span>
                <strong>{p.profesor_nombre}</strong>
                <small>{p.course_titulo}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <Conversacion courseId={cursoActivo.course_id} onVolver={() => setCursoActivo(null)} />
      )}
    </div>
  );
};

const Conversacion = ({ courseId, onVolver }) => {
  const { t } = useIdioma();
  const [mensajes, setMensajes] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    lmsService.getConversacion(courseId).then((r) => setMensajes(r.mensajes)).catch(() => setError('No se pudo cargar la conversación.'));
  };

  useEffect(cargar, [courseId]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setError('');
    try {
      await lmsService.enviarMensaje(courseId, texto.trim());
      setTexto('');
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mj-conversacion">
      <button className="mj-volver" onClick={onVolver}><i className="fa-solid fa-arrow-left" /> {t('mensajes')}</button>

      <div className="mj-hilo">
        {mensajes === null && <p className="mj-vacio">Cargando…</p>}
        {mensajes?.length === 0 && <p className="mj-vacio">{t('sinMensajes')}</p>}
        {mensajes?.map((m) => (
          <div key={m.id} className={`mj-burbuja ${m.es_mio ? 'mj-burbuja--mia' : ''}`}>
            {m.cuerpo}
          </div>
        ))}
      </div>

      <form className="mj-form" onSubmit={handleEnviar}>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t('escribeUnMensaje')}
          maxLength={2000}
        />
        <button type="submit" disabled={enviando}><i className="fa-solid fa-paper-plane" /></button>
      </form>
      {error && <p className="mj-error">{error}</p>}
    </div>
  );
};

export default MensajeriaPanel;
