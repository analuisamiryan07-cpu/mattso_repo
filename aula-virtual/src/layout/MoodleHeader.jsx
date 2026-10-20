// Header exclusivo de las pantallas de Moodle (/moodle, /moodle/mis-cursos,
// /moodle/notificaciones, /moodle/mensajes, /curso/tradicional/:id) —
// Coursera y Panel General siguen usando AulaHeader tal cual. Logo (vuelve a
// "/", igual que en todos lados), selector de idioma, acceso directo al
// calendario, campana de notificaciones y mensajería — estas dos últimas
// llevan a su propia pantalla completa (ver NotificacionesMoodle.jsx /
// MensajesMoodle.jsx), no son desplegables — y el mismo menú de perfil que
// ya usa AulaHeader.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import { useIdioma } from '@context/IdiomaContext';
import MenuPerfil from './MenuPerfil';
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
        <Link to="/moodle/notificaciones" className="mh-icon-btn" title="Notificaciones">
          <i className="fa-regular fa-bell" />
          <BadgeNotificaciones />
        </Link>
        <Link to="/moodle/mensajes" className="mh-icon-btn" title="Mensajes">
          <i className="fa-regular fa-comment-dots" />
        </Link>
        <MenuPerfil />
      </div>
    </header>
  );
};

const IDIOMAS = [
  { codigo: 'en', label: 'English (en)' },
  { codigo: 'es', label: 'Español - Internacional (es)' },
];

const SelectorIdioma = () => {
  const { idioma, cambiarIdioma } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef(null);

  useEffect(() => {
    const cerrarSiFueraDeLaCaja = (e) => {
      if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrarSiFueraDeLaCaja);
    return () => document.removeEventListener('mousedown', cerrarSiFueraDeLaCaja);
  }, []);

  return (
    <div className="mh-dropdown-wrap" ref={cajaRef}>
      <button className="mh-icon-btn mh-idioma-btn" onClick={() => setAbierto((v) => !v)} title="ES / EN">
        <i className="fa-solid fa-language" />
        <i className="fa-solid fa-chevron-down mh-idioma-caret" />
      </button>
      {abierto && (
        <div className="mh-dropdown mh-dropdown--idioma">
          {IDIOMAS.map((op) => (
            <button
              key={op.codigo}
              className={`mh-idioma-item ${idioma === op.codigo ? 'is-active' : ''}`}
              onClick={() => { cambiarIdioma(op.codigo); setAbierto(false); }}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const BadgeNotificaciones = () => {
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    const cargar = () => lmsService.getNotificaciones().then((r) => setNoLeidas(r.no_leidas)).catch(() => {});
    cargar();
    const intervalo = setInterval(cargar, 2 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  if (noLeidas === 0) return null;
  return <span className="mh-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>;
};

export default MoodleHeader;
