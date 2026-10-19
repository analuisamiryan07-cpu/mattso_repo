// Panel General — primera pantalla que ve el estudiante una vez que tiene
// al menos un curso vigente (si no tiene ninguno, ver IngresarClave.jsx).
// Solo clasifica entre Moodle y Coursera ("arriba Moodle con su botón
// Periodo 2026, debajo Coursera con el suyo; si solo tiene una modalidad,
// sale solo esa") — la lista de cursos de cada una vive en Área Personal.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@api/authService';
import { lmsService } from '@api/lmsService';
import AulaHeader from '@layout/AulaHeader';
import AulaFooter from '@layout/AulaFooter';
import './PanelGeneral.css';

const PanelGeneral = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  useEffect(() => {
    lmsService.getMisCursos().then(setData).catch(() => setData({ moodle: [], coursera: [] }));
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <div className="pg-shell">
      <AulaHeader variant="panel" />

      <main className="pg-main">
        <div className="pg-welcome">
          <h1>Bienvenido, {user?.nombre}</h1>
          <div className="pg-welcome-right">
            <span className="pg-welcome-correo">{user?.correo}</span>
            <button className="pg-logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
            </button>
          </div>
        </div>

        {!data ? (
          <p className="pg-cargando">Cargando…</p>
        ) : (
          <div className="pg-bloques">
            {data.moodle.length > 0 && (
              <BloqueModalidad
                nombre="Moodle"
                icono="fa-chalkboard-user"
                descripcion="Cursos con profesor, tareas y evaluaciones."
                onEntrar={() => navigate('/moodle')}
              />
            )}
            {data.coursera.length > 0 && (
              <BloqueModalidad
                nombre="Coursera"
                icono="fa-laptop-code"
                descripcion="Cursos a tu ritmo, con módulos y video."
                onEntrar={() => navigate('/coursera')}
              />
            )}
          </div>
        )}
      </main>

      <AulaFooter />
    </div>
  );
};

const BloqueModalidad = ({ nombre, icono, descripcion, onEntrar }) => (
  <section className="pg-bloque">
    <div className="pg-bloque-icono"><i className={`fa-solid ${icono}`} /></div>
    <div className="pg-bloque-info">
      <h2>{nombre}</h2>
      <p>{descripcion}</p>
    </div>
    <button className="pg-bloque-btn" onClick={onEntrar}>Periodo 2026</button>
  </section>
);

export default PanelGeneral;
