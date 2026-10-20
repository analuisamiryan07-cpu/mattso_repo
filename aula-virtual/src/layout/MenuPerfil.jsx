// Menú circular de perfil — lo usan AulaHeader (variant="area", Coursera) y
// MoodleHeader (Moodle). Mismo botón "Ver perfil"/"Cerrar sesión" en los dos.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@api/authService';
import './MenuPerfil.css';

const MenuPerfil = () => {
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef(null);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  useEffect(() => {
    const cerrarSiFueraDeLaCaja = (e) => {
      if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrarSiFueraDeLaCaja);
    return () => document.removeEventListener('mousedown', cerrarSiFueraDeLaCaja);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
    window.location.reload();
  };

  const iniciales = (user?.nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  return (
    <div className="mp-profile" ref={cajaRef}>
      <button className="mp-avatar" onClick={() => setAbierto((v) => !v)} title="Ver perfil">
        {iniciales}
      </button>
      {abierto && (
        <div className="mp-profile-menu">
          <p className="mp-profile-nombre">{user?.nombre}</p>
          <p className="mp-profile-correo">{user?.correo}</p>
          <hr />
          <button className="mp-profile-logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuPerfil;
