// Pantalla completa de notificaciones (no un desplegable) — lista a la
// izquierda, detalle a la derecha, calcado de la referencia de Moodle que
// envió la usuaria: fila con avatar+nombre arriba, "Notificaciones" debajo.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import { authService } from '@api/authService';
import MoodleHeader from '@layout/MoodleHeader';
import MoodleFooter from '@layout/MoodleFooter';
import { useIdioma } from '@context/IdiomaContext';
import './NotificacionesMoodle.css';

const NotificacionesMoodle = () => {
  const { t } = useIdioma();
  const user = authService.getCurrentUser();
  const [data, setData] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);

  const cargar = () => {
    lmsService.getNotificaciones().then(setData).catch(() => setData({ items: [], no_leidas: 0 }));
  };
  useEffect(cargar, []);

  const iniciales = (user?.nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  const abrir = async (n) => {
    setSeleccionada(n);
    if (!n.leido_at) {
      await lmsService.marcarNotificacionLeida(n.id).catch(() => {});
      cargar();
    }
  };

  return (
    <div className="nm-shell">
      <MoodleHeader />

      <main className="nm-main">
        <div className="nm-perfil-row">
          <span className="nm-avatar">{iniciales}</span>
          <strong>{user?.nombre}</strong>
          <Link to="/moodle/mensajes" className="nm-link-mensaje">
            <i className="fa-regular fa-comment-dots" /> {t('mensajes')}
          </Link>
        </div>

        <div className="nm-card">
          <h1>{t('notificaciones')}</h1>

          <div className="nm-layout">
            <ul className="nm-lista">
              {data === null && <li className="nm-vacio">Cargando…</li>}
              {data && data.items.length === 0 && <li className="nm-vacio">{t('sinNotificaciones')}</li>}
              {data?.items.map((n) => (
                <li key={n.id}>
                  <button
                    className={`nm-item ${!n.leido_at ? 'nm-item--no-leida' : ''} ${seleccionada?.id === n.id ? 'is-active' : ''}`}
                    onClick={() => abrir(n)}
                  >
                    <i className="fa-regular fa-circle-dot" />
                    <span>
                      <strong>{n.titulo}</strong>
                      <small>{new Date(n.created_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="nm-detalle">
              {!seleccionada ? (
                <p>Seleccione desde la lista lateral de notificaciones para ver más detalles</p>
              ) : (
                <div className="nm-detalle-contenido">
                  <h2>{seleccionada.titulo}</h2>
                  {seleccionada.cuerpo && <p>{seleccionada.cuerpo}</p>}
                  <time>{new Date(seleccionada.created_at).toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short' })}</time>
                  {seleccionada.enlace && <Link to={seleccionada.enlace} className="nm-ir">Ir →</Link>}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <MoodleFooter />
    </div>
  );
};

export default NotificacionesMoodle;
