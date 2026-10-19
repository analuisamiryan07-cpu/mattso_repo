// Header compartido de toda la parte de estudiante del Aula Virtual (Panel
// General, Ingresar clave, Área Personal). El logo SIEMPRE lleva de vuelta
// al Panel General (/) — nunca al sitio público, a propósito (así lo pidió
// la usuaria: "cuando se presione el logo te redirija al panel general").
//
// variant="panel" (Panel General / Ingresar clave): logo + buscador rápido
//   de los cursos propios (filtra en memoria lo que ya trajo /lms/courses,
//   no pega contra el backend) — al encontrar una coincidencia, lleva
//   directo al visor de ese curso.
// variant="area" (Área Personal en adelante): logo + menú circular con
//   nombre/correo ("ver perfil") y cerrar sesión.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@api/authService';
import { lmsService } from '@api/lmsService';
import './AulaHeader.css';

const logoImg = 'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png';

const AulaHeader = ({ variant = 'panel' }) => {
  return (
    <header className="ah-header">
      <Link to="/" className="ah-brand">
        <img src={logoImg} alt="Sapper Industries" className="ah-brand-logo" />
        <span className="ah-brand-text">Aula Virtual</span>
      </Link>
      {variant === 'panel' ? <BuscadorCursos /> : <MenuPerfil />}
    </header>
  );
};

const BuscadorCursos = () => {
  const [termino, setTermino] = useState('');
  const [cursos, setCursos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef(null);

  useEffect(() => {
    lmsService.getMisCursos()
      .then((data) => {
        const todos = [
          ...data.moodle.map((c) => ({ ...c, ruta: `/curso/tradicional/${c.course.id}` })),
          ...data.coursera.map((c) => ({ ...c, ruta: `/curso/vod/${c.course.id}` })),
        ];
        setCursos(todos);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cerrarSiFueraDeLaCaja = (e) => {
      if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrarSiFueraDeLaCaja);
    return () => document.removeEventListener('mousedown', cerrarSiFueraDeLaCaja);
  }, []);

  const resultados = termino.trim()
    ? cursos.filter((c) => c.course.titulo.toLowerCase().includes(termino.trim().toLowerCase()))
    : [];

  return (
    <div className="ah-search" ref={cajaRef}>
      <i className="fa-solid fa-magnifying-glass" />
      <input
        type="text"
        placeholder="Buscar en mis cursos…"
        value={termino}
        onChange={(e) => { setTermino(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && termino.trim() && (
        <div className="ah-search-dropdown">
          {resultados.length === 0 ? (
            <p className="ah-search-vacio">Sin coincidencias.</p>
          ) : (
            resultados.map((c) => (
              <Link key={c.access_grant_id} to={c.ruta} className="ah-search-item" onClick={() => setAbierto(false)}>
                {c.course.titulo}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const MenuPerfil = () => {
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef(null);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  useEffect(() => {
    const cerrarSiFueraDeLaCaja = (e) => {
      if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrarSiFueraDeLaCaja);
    return () => document.removeEventListener('mousedown', cerrarSiFueraDeLaCaja);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
    window.location.reload();
  };

  const iniciales = (user?.nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  return (
    <div className="ah-profile" ref={cajaRef}>
      <button className="ah-avatar" onClick={() => setAbierto((v) => !v)} title="Ver perfil">
        {iniciales}
      </button>
      {abierto && (
        <div className="ah-profile-menu">
          <p className="ah-profile-nombre">{user?.nombre}</p>
          <p className="ah-profile-correo">{user?.correo}</p>
          <hr />
          <button className="ah-profile-logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default AulaHeader;
