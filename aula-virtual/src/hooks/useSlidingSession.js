import { useEffect, useRef } from 'react';
import { authService } from '@api/authService';

// Sesión "deslizante": mientras la persona esté usando el Aula Virtual, la
// sesión no se cierra — se va renovando sola. Si deja de tocar nada por
// INACTIVIDAD_MS, se cierra sola, sin esperar a que el token vencido falle
// en medio de algo.
//
// Cómo funciona: cualquier movimiento de mouse/teclado/clic/scroll actualiza
// "última actividad" (solo en una ref, sin volver a renderizar nada). Cada
// minuto se revisa: si pasó mucho rato sin actividad, se cierra la sesión;
// si no, y ya pasó un buen rato desde la última renovación, se pide un token
// nuevo — bien antes de que el actual (2h) venza, para no cortar a nadie a
// medio curso.
const INACTIVIDAD_MS = 30 * 60 * 1000; // 30 min sin tocar nada -> se cierra sola
const RENOVAR_CADA_MS = 15 * 60 * 1000; // mientras esté activo, renueva cada 15 min
const REVISAR_CADA_MS = 60 * 1000;
const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export function useSlidingSession(activa) {
  const ultimaActividad = useRef(Date.now());
  const ultimaRenovacion = useRef(Date.now());

  useEffect(() => {
    if (!activa) return undefined;

    const marcarActividad = () => { ultimaActividad.current = Date.now(); };
    EVENTOS_ACTIVIDAD.forEach((ev) => window.addEventListener(ev, marcarActividad, { passive: true }));

    const revisar = () => {
      const ahora = Date.now();
      const inactivaDesde = ahora - ultimaActividad.current;

      if (inactivaDesde >= INACTIVIDAD_MS) {
        authService.logout();
        window.dispatchEvent(new Event('auth:logout'));
        return;
      }

      if (ahora - ultimaRenovacion.current >= RENOVAR_CADA_MS) {
        ultimaRenovacion.current = ahora;
        authService.refresh().catch(() => {
          // Si falla (token ya vencido, red caída, etc.), no se fuerza nada
          // aquí — el próximo 401 real ya dispara auth:logout por su cuenta.
        });
      }
    };

    const intervalo = setInterval(revisar, REVISAR_CADA_MS);

    return () => {
      EVENTOS_ACTIVIDAD.forEach((ev) => window.removeEventListener(ev, marcarActividad));
      clearInterval(intervalo);
    };
  }, [activa]);
}
