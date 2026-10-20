// Pie de página exclusivo de Moodle — calcado de la referencia que envió la
// usuaria: logo centrado sobre fondo oscuro, debajo la fila de sesión
// ("Usted se ha identificado como...") y los enlaces legales. Los dos
// enlaces van a la misma página de Términos del sitio público — es el único
// documento legal real que existe hoy, no se inventa contenido nuevo.

import { authService } from '@api/authService';
import './MoodleFooter.css';

const logoImg = 'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png';
const SITIO_PUBLICO_URL = import.meta.env.VITE_SITIO_PUBLICO_URL || 'https://sapper-industries.com';

const MoodleFooter = () => {
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  return (
    <footer className="mf-footer">
      <div className="mf-logo-band">
        <img src={logoImg} alt="Sapper Industries" className="mf-logo" />
      </div>

      <div className="mf-info-band">
        <span>
          Usted se ha identificado como <strong>{user?.nombre}</strong>{' '}
          (<a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Cerrar sesión</a>)
        </span>
        <a href={`${SITIO_PUBLICO_URL}/terminos`} target="_blank" rel="noopener noreferrer">Política de privacidad</a>
        <a href={`${SITIO_PUBLICO_URL}/terminos`} target="_blank" rel="noopener noreferrer">Resumen de retención de datos</a>
      </div>

      <div className="mf-bottom">© 2026 Sapper Industries. Todos los derechos reservados.</div>
    </footer>
  );
};

export default MoodleFooter;
