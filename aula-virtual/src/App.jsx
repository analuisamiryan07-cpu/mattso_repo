// Raíz del proyecto Aula Virtual — deploy y dominio aparte del sitio público
// (ver aula-virtual/README.md). Portón de 2 pasos (login+pago -> clave) y,
// una vez pasado, enruta por rol:
//   - ESTUDIANTE: Mis cursos -> CursoVOD (look Coursera) o CursoTradicional
//     (look Moodle), según el delivery_mode de cada curso.
//   - PROFESOR: sus cursos + entregas pendientes por calificar.

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '@api/authService';
import { lmsService } from '@api/lmsService';
import Login from '@pages/Login';
import Clave from '@pages/Clave';
import AulaLayout from '@layout/AulaLayout';
import MisCursos from '@pages/MisCursos';
import CursoVOD from '@pages/CursoVOD';
import CursoTradicional from '@pages/CursoTradicional';
import MisCursosProfesor from '@pages/profesor/MisCursosProfesor';
import CursoProfesor from '@pages/profesor/CursoProfesor';

function Portal() {
  // 'cargando' | 'login' | 'clave' | 'listo'
  const [paso, setPaso] = useState('cargando');

  const revisarEstado = () => {
    if (!authService.isAuthenticated()) { setPaso('login'); return; }
    lmsService
      .getEstadoAcceso()
      .then(({ desbloqueado }) => setPaso(desbloqueado ? 'listo' : 'clave'))
      .catch(() => { authService.logout(); setPaso('login'); });
  };

  useEffect(revisarEstado, []);
  useEffect(() => {
    const onLogout = () => setPaso('login');
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  if (paso === 'cargando') return null;
  if (paso === 'login') return <Login onSuccess={revisarEstado} />;
  if (paso === 'clave') return <Clave onSuccess={revisarEstado} />;

  const user = authService.getCurrentUser();
  const esProfesor = user?.rol === 'PROFESOR';

  return (
    <AulaLayout>
      <Routes>
        {esProfesor ? (
          <>
            <Route path="/" element={<MisCursosProfesor />} />
            <Route path="/curso/:courseId" element={<CursoProfesor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<MisCursos />} />
            <Route path="/curso/vod/:courseId" element={<CursoVOD />} />
            <Route path="/curso/tradicional/:courseId" element={<CursoTradicional />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </AulaLayout>
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
