// Cabecera propia del Aula Virtual — deliberadamente distinta del Header del
// sitio público (sin menú de Programas/Nosotros/Contacto): esto es una app
// aparte, no una sección más del sitio.

import { authService } from '@api/authService';
import './AulaVirtualLayout.css';

const AulaVirtualLayout = ({ children }) => {
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/aula-virtual';
  };

  return (
    <div className="av-shell">
      <header className="av-topbar">
        <a href="/" className="av-brand">
          <span className="av-brand-mark">S</span>
          <span className="av-brand-text">
            <b>Sapper Industries</b>
            <small>Aula Virtual</small>
          </span>
        </a>
        {user && (
          <div className="av-user">
            <span className="av-user-name">{user.nombre}</span>
            <span className="av-user-rol">{user.rol === 'PROFESOR' ? 'Profesor' : 'Estudiante'}</span>
            <button className="av-logout" onClick={handleLogout} title="Cerrar sesión">
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </div>
        )}
      </header>
      <main className="av-main">{children}</main>
    </div>
  );
};

export default AulaVirtualLayout;
