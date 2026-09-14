// Raíz de la app aparte "Aula Virtual" (montada en /aula-virtual/* dentro del
// mismo router de React, pero sin el Header/Footer del sitio público — ver
// App.jsx). Controla el portón de 2 pasos (login -> clave) y, una vez
// pasado, decide qué ve cada quien según su rol:
//   - ESTUDIANTE: Mis cursos / detalle de curso (sirve tanto para cursos
//     TRADICIONAL como ASINCRONO_VOD — CursoDetalle ya distingue por tipo
//     de contenido, no hace falta una pantalla "Coursera" separada de una
//     "Moodle").
//   - PROFESOR: sus cursos + entregas pendientes por calificar.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '@api/authService';
import { lmsService } from '@api/lmsService';
import AulaVirtualLogin from './AulaVirtualLogin';
import AulaVirtualClave from './AulaVirtualClave';
import AulaVirtualLayout from './AulaVirtualLayout';
import MisCursos from '@pages/lms/MisCursos';
import CursoDetalle from '@pages/lms/CursoDetalle';
import MisCursosProfesor from '@pages/lms/profesor/MisCursosProfesor';

const AulaVirtualApp = () => {
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

  if (paso === 'cargando') return null;
  if (paso === 'login') return <AulaVirtualLogin onSuccess={revisarEstado} />;
  if (paso === 'clave') return <AulaVirtualClave onSuccess={revisarEstado} />;

  const user = authService.getCurrentUser();
  const esProfesor = user?.rol === 'PROFESOR';

  return (
    <AulaVirtualLayout>
      <Routes>
        {esProfesor ? (
          <>
            <Route path="/" element={<MisCursosProfesor />} />
            <Route path="*" element={<Navigate to="/aula-virtual" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<MisCursos />} />
            <Route path="/curso/:courseId" element={<CursoDetalle />} />
            <Route path="*" element={<Navigate to="/aula-virtual" replace />} />
          </>
        )}
      </Routes>
    </AulaVirtualLayout>
  );
};

export default AulaVirtualApp;
