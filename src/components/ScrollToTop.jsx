import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router no reinicia el scroll al navegar entre páginas (es un SPA,
 * el navegador no hace una carga de página real). Sin esto, si el usuario
 * bajó en la página anterior y hace clic en un link, la página nueva
 * aparece con esa misma posición de scroll en vez de empezar desde arriba.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
