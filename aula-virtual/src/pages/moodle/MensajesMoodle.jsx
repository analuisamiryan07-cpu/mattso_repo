// Pantalla completa de mensajería (no un desplegable) — lista de profesores
// a la izquierda con buscador, conversación a la derecha. Solo el estudiante
// escribe; la bandeja del profesor es una fase posterior, ya acordada.

import { useEffect, useMemo, useState } from 'react';
import { lmsService } from '@api/lmsService';
import MoodleHeader from '@layout/MoodleHeader';
import MoodleFooter from '@layout/MoodleFooter';
import { useIdioma } from '@context/IdiomaContext';
import './MensajesMoodle.css';

const MensajesMoodle = () => {
  const { t } = useIdioma();
  const [profesores, setProfesores] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [activo, setActivo] = useState(null);

  useEffect(() => {
    lmsService.getProfesoresParaMensajear().then(setProfesores).catch(() => setProfesores([]));
  }, []);

  const filtrados = useMemo(() => {
    if (!profesores) return [];
    if (!busqueda.trim()) return profesores;
    const q = busqueda.trim().toLowerCase();
    return profesores.filter((p) => p.profesor_nombre.toLowerCase().includes(q) || p.course_titulo.toLowerCase().includes(q));
  }, [profesores, busqueda]);

  return (
    <div className="mm-shell">
      <MoodleHeader />

      <main className="mm-main">
        <div className="mm-card">
          <div className="mm-layout">
            <div className="mm-panel-izq">
              <div className="mm-buscador">
                <i className="fa-solid fa-magnifying-glass" />
                <input type="text" placeholder={t('buscador')} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>

              <ul className="mm-lista">
                {profesores === null && <li className="mm-vacio">Cargando…</li>}
                {profesores?.length === 0 && <li className="mm-vacio">No tienes cursos Moodle con profesor asignado.</li>}
                {filtrados.map((p) => (
                  <li key={p.course_id}>
                    <button className={`mm-item ${activo?.course_id === p.course_id ? 'is-active' : ''}`} onClick={() => setActivo(p)}>
                      <span className="mm-avatar">{(p.profesor_nombre || '?')[0]}</span>
                      <span>
                        <strong>{p.profesor_nombre}</strong>
                        <small>{p.course_titulo}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mm-panel-der">
              {!activo ? (
                <p className="mm-vacio-der">{t('elegirProfesor')}</p>
              ) : (
                <Conversacion key={activo.course_id} profesor={activo} />
              )}
            </div>
          </div>
        </div>
      </main>

      <MoodleFooter />
    </div>
  );
};

const Conversacion = ({ profesor }) => {
  const { t } = useIdioma();
  const [mensajes, setMensajes] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    lmsService.getConversacion(profesor.course_id).then((r) => setMensajes(r.mensajes)).catch(() => setError('No se pudo cargar la conversación.'));
  };
  useEffect(cargar, [profesor.course_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setError('');
    try {
      await lmsService.enviarMensaje(profesor.course_id, texto.trim());
      setTexto('');
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mm-conversacion">
      <div className="mm-conv-header">
        <span className="mm-avatar">{(profesor.profesor_nombre || '?')[0]}</span>
        <div>
          <strong>{profesor.profesor_nombre}</strong>
          <small>{profesor.course_titulo}</small>
        </div>
      </div>

      <div className="mm-hilo">
        {mensajes === null && <p className="mm-vacio-der">Cargando…</p>}
        {mensajes?.length === 0 && <p className="mm-vacio-der">{t('sinMensajes')}</p>}
        {mensajes?.map((m) => (
          <div key={m.id} className={`mm-burbuja ${m.es_mio ? 'mm-burbuja--mia' : ''}`}>{m.cuerpo}</div>
        ))}
      </div>

      <form className="mm-form" onSubmit={handleEnviar}>
        <input type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t('escribeUnMensaje')} maxLength={2000} />
        <button type="submit" disabled={enviando}><i className="fa-solid fa-paper-plane" /></button>
      </form>
      {error && <p className="mm-error">{error}</p>}
    </div>
  );
};

export default MensajesMoodle;
