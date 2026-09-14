import { authService } from '@api/authService';
import './AulaLayout.css';

const SITIO_PUBLICO_URL = import.meta.env.VITE_SITIO_PUBLICO_URL || 'https://sapper-industries.com';

const AulaLayout = ({ children }) => {
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <div className="av-shell">
      <header className="av-topbar">
        <a href={SITIO_PUBLICO_URL} className="av-brand">
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

export default AulaLayout;
