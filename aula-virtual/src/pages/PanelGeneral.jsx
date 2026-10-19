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
  const [mostrarAñadir, setMostrarAñadir] = useState(false);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const cargar = () => {
    lmsService.getMisCursos().then(setData).catch(() => setData({ moodle: [], coursera: [] }));
  };

  useEffect(cargar, []);

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

        {/* Entrada de clave SIEMPRE visible aquí, sin importar qué modalidades
            tenga ya — si solo tiene Moodle y canjea una clave de Coursera,
            es aquí donde puede hacerlo (no hay otra forma de llegar a una
            modalidad que todavía no tiene ningún curso). */}
        <div className="pg-añadir-row">
          <button className="pg-añadir-btn" onClick={() => setMostrarAñadir((v) => !v)}>
            <i className="fa-solid fa-plus" /> Añadir curso
          </button>
        </div>
        {mostrarAñadir && (
          <AñadirCursoForm onSuccess={() => { setMostrarAñadir(false); cargar(); }} onCancel={() => setMostrarAñadir(false)} />
        )}

        {!data ? (
          <p className="pg-cargando">Cargando…</p>
        ) : (
          <div className="pg-bloques">
            {data.moodle.length === 0 && data.coursera.length === 0 && !mostrarAñadir && (
              <p className="pg-cargando">Todavía no tienes ningún curso activo — usa "Añadir curso" arriba.</p>
            )}
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

const AñadirCursoForm = ({ onSuccess, onCancel }) => {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clave.trim()) { setError('Escribe el código que te enviamos por correo.'); return; }
    setLoading(true);
    setError('');
    setOk('');
    try {
      const res = await lmsService.canjearClave(clave.trim());
      setOk(`¡Listo! "${res.curso?.titulo}" ya está en tus cursos.`);
      setClave('');
      setTimeout(() => onSuccess?.(), 700);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo validar la clave.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="pg-añadir-form" onSubmit={handleSubmit}>
      <label htmlFor="pg-clave">Código de acceso al curso</label>
      <div className="pg-añadir-form-row">
        <input
          id="pg-clave"
          type="text"
          inputMode="numeric"
          value={clave}
          onChange={(e) => setClave(e.target.value.replace(/\D/g, '').slice(0, 12))}
          placeholder="0000000000"
          maxLength={12}
          autoComplete="off"
        />
        <button type="submit" disabled={loading}>{loading ? 'Validando…' : 'Añadir curso'}</button>
        <button type="button" className="pg-añadir-cancelar" onClick={onCancel}>Cancelar</button>
      </div>
      {error && <p className="pg-error">{error}</p>}
      {ok && <p className="pg-ok">{ok}</p>}
    </form>
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
