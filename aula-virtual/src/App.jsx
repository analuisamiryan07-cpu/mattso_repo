// Raíz del proyecto Aula Virtual — deploy y dominio aparte del sitio público
// (ver aula-virtual/README.md). Portón de 1 solo paso: correo + contraseña,
// validado contra el backend (authService.gateLogin exige además una orden
// pagada — ver lms-gate.service.ts). Una vez logueado, enruta por rol:
//   - ESTUDIANTE: Landing decide entre IngresarClave (sin ningún curso
//     vigente todavía) o PanelGeneral (bloques Moodle/Coursera) -> al
//     presionar "Periodo 2026" de cada bloque va a AreaPersonal (dashboard
//     de 4 tarjetas + mis cursos de esa modalidad) -> CursoVOD (look
//     Coursera) o CursoTradicional (look Moodle) al abrir un curso.
//   - PROFESOR: sus cursos + entregas pendientes por calificar (sin cambios
//     en esta fase).

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '@api/authService';
import { lmsService } from '@api/lmsService';
import { useSlidingSession } from '@hooks/useSlidingSession';
import { IdiomaProvider } from '@context/IdiomaContext';
import Login from '@pages/Login';
import AulaLayout from '@layout/AulaLayout';
import IngresarClave from '@pages/IngresarClave';
import PanelGeneral from '@pages/PanelGeneral';
import AreaPersonal from '@pages/AreaPersonal';
import AreaPersonalMoodle from '@pages/moodle/AreaPersonalMoodle';
import MisCursosMoodle from '@pages/moodle/MisCursosMoodle';
import NotificacionesMoodle from '@pages/moodle/NotificacionesMoodle';
import MensajesMoodle from '@pages/moodle/MensajesMoodle';
import CursoVOD from '@pages/CursoVOD';
import CursoTradicional from '@pages/CursoTradicional';
import MisCursosProfesor from '@pages/profesor/MisCursosProfesor';
import CursoProfesor from '@pages/profesor/CursoProfesor';

// Decide entre "Ingresa tu clave" (sin ningún curso vigente todavía) y el
// Panel General (al menos un curso) — se resuelve una sola vez al entrar.
// Si la verificación falla (token vencido, red, lo que sea), NUNCA se debe
// asumir que sí tiene cursos para dejarlo pasar al Panel General — se cierra
// la sesión y se manda a login, igual que hace el interceptor de 401 en
// client.js. "Sin verificar que sí tiene un curso vigente, no entra" por
// ningún motivo.
const Landing = () => {
  const [sinCursos, setSinCursos] = useState(null); // null = cargando

  const revisar = () => {
    lmsService.getMisCursos()
      .then((data) => setSinCursos(data.moodle.length === 0 && data.coursera.length === 0))
      .catch(() => {
        authService.logout();
        window.dispatchEvent(new Event('auth:logout'));
      });
  };

  useEffect(revisar, []);

  if (sinCursos === null) return null;
  return sinCursos ? <IngresarClave onCanjeada={revisar} /> : <PanelGeneral />;
};

function Portal() {
  // 'cargando' | 'login' | 'listo'
  const [paso, setPaso] = useState('cargando');

  const revisarEstado = () => {
    setPaso(authService.isAuthenticated() ? 'listo' : 'login');
  };

  useEffect(revisarEstado, []);
  useEffect(() => {
    const onLogout = () => setPaso('login');
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  // Sesión deslizante: se mantiene abierta con actividad, se cierra sola a
  // los 30 min de inactividad — solo corre una vez que ya está adentro.
  useSlidingSession(paso === 'listo');

  if (paso === 'cargando') return null;
  if (paso === 'login') return <Login onSuccess={revisarEstado} />;

  const user = authService.getCurrentUser();
  const esProfesor = user?.rol === 'PROFESOR';

  // El lado profesor sigue con el topbar simple de AulaLayout (sin cambios,
  // fuera de alcance de esta fase). El lado estudiante ya no se envuelve en
  // AulaLayout: cada pantalla trae su propio header+footer completos
  // (Panel General / Ingresar clave / Área Personal / visores de curso).
  if (esProfesor) {
    return (
      <AulaLayout>
        <Routes>
          <Route path="/" element={<MisCursosProfesor />} />
          <Route path="/curso/:courseId" element={<CursoProfesor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AulaLayout>
    );
  }

  return (
    <IdiomaProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/moodle" element={<AreaPersonalMoodle />} />
        <Route path="/moodle/mis-cursos" element={<MisCursosMoodle />} />
        <Route path="/moodle/notificaciones" element={<NotificacionesMoodle />} />
        <Route path="/moodle/mensajes" element={<MensajesMoodle />} />
        <Route path="/coursera" element={<AreaPersonal />} />
        <Route path="/curso/vod/:courseId" element={<CursoVOD />} />
        <Route path="/curso/tradicional/:courseId" element={<CursoTradicional />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </IdiomaProvider>
  );
}

function App() {
  return (
    <Router>
      <Portal />
    </Router>
  );
}

export default App;
