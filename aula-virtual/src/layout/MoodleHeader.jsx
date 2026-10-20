// Header exclusivo de las pantallas de Moodle (/moodle, /moodle/mis-cursos,
// /curso/tradicional/:id) — Coursera y Panel General siguen usando
// AulaHeader tal cual. Logo (vuelve a "/", igual que en todos lados),
// selector de idioma, acceso directo al calendario, campana de
// notificaciones y mensajería con el profesor, y el mismo menú de perfil
// que ya usa AulaHeader.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import { useIdioma } from '@context/IdiomaContext';
import MenuPerfil from './MenuPerfil';
import MensajeriaPanel from './MensajeriaPanel';
import './MoodleHeader.css';

const logoImg = 'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png';

const MoodleHeader = () => {
  return (
    <header className="mh-header">
      <Link to="/" className="mh-brand">
        <img src={logoImg} alt="Sapper Industries" className="mh-brand-logo" />
        <span className="mh-brand-text">Aula Virtual — Moodle</span>
      </Link>
      <div className="mh-acciones">
        <SelectorIdioma />
        <Link to="/moodle#calendario" className="mh-icon-btn" title="Calendario">
          <i className="fa-regular fa-calendar" />
        </Link>
        <CampanaNotificaciones />
        <BotonMensajes />
        <MenuPerfil />
      </div>
    </header>
  );
};

const SelectorIdioma = () => {
  const { idioma, cambiarIdioma } = useIdioma();
  return (
    <button
      className="mh-icon-btn mh-idioma"
      onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
      title="ES / EN"
    >
      {idioma === 'es' ? 'ES' : 'EN'}
    </button>
  );
};

const CampanaNotificaciones = () => {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [data, setData] = useState(null);
  const cajaRef = useRef(null);

  const cargar = () => {
    lmsService.getNotificaciones().then(setData).catch(() => {});
  };

  useEffect(() => {
    cargar();
    // Refresca cada 2 min mientras la pestaña está abierta, para que la
    // campana no se quede desactualizada toda la sesión.
    const intervalo = setInterval(cargar, 2 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const cerrarSiFueraDeLaCaja = (e) => {
      if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrarSiFueraDeLaCaja);
    return () => document.removeEventListener('mousedown', cerrarSiFueraDeLaCaja);
  }, []);

  const handleClicNotificacion = async (n) => {
    if (!n.leido_at) {
      await lmsService.marcarNotificacionLeida(n.id).catch(() => {});
      cargar();
    }
    if (n.enlace) window.location.href = n.enlace;
  };

  return (
    <div className="mh-dropdown-wrap" ref={cajaRef}>
      <button className="mh-icon-btn" onClick={() => setAbierto((v) => !v)} title={t('notificaciones')}>
        <i className="fa-regular fa-bell" />
        {data?.no_leidas > 0 && <span className="mh-badge">{data.no_leidas > 9 ? '9+' : data.no_leidas}</span>}
      </button>
      {abierto && (
        <div className="mh-dropdown">
          <h3>{t('notificaciones')}</h3>
          {(!data || data.items.length === 0) && <p className="mh-dropdown-vacio">{t('sinNotificaciones')}</p>}
          {data?.items.map((n) => (
            <button
              key={n.id}
              className={`mh-notif-item ${!n.leido_at ? 'mh-notif-item--no-leida' : ''}`}
              onClick={() => handleClicNotificacion(n)}
            >
              <strong>{n.titulo}</strong>
              {n.cuerpo && <span>{n.cuerpo}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const BotonMensajes = () => {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="mh-dropdown-wrap">
      <button className="mh-icon-btn" onClick={() => setAbierto((v) => !v)} title={t('mensajes')}>
        <i className="fa-regular fa-comment-dots" />
      </button>
      {abierto && <MensajeriaPanel onClose={() => setAbierto(false)} />}
    </div>
  );
};

export default MoodleHeader;
