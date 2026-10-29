import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router no reinicia el scroll al navegar entre páginas (es un SPA,
 * el navegador no hace una carga de página real). Sin esto, si el usuario
 * bajó en la página anterior y hace clic en un link, la página nueva
 * aparece con esa misma posición de scroll en vez de empezar desde arriba.
 * Si la URL trae un #ancla, se respeta.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Con ancla (ej. /terminos#proteccion-datos) se baja a esa sección en vez de arriba.
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
