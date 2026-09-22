import React, { useState, useEffect } from 'react';
import CourseCard from '@components/CourseCard';
import { cursosService } from '@api/cursosService';
import './Catalogo.css';

// Catálogo de Cursos (Aula Virtual — Moodle/Coursera). Mismo patrón que
// Capacitaciones.jsx/Certificaciones.jsx, filtrando por modalidad Moodle/
// Coursera en vez de Virtual/Presencial.
const MODALIDADES = ['Todas', 'Moodle', 'Coursera'];

const Cursos = () => {
  const [cursos, setCursos] = useState([]);
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCursos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cursosService.getCursosLms();
      if (Array.isArray(data)) {
        setCursos(data);
      } else {
        throw new Error('La respuesta del servidor no es un catálogo válido.');
      }
    } catch (err) {
      console.error('Error fetching cursos:', err);
      setError('No se pudo cargar la lista de cursos. Por favor, verifica tu conexión o vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const filtered = cursos.filter((c) => {
    const matchMod = filtroModalidad === 'Todas'
      || (filtroModalidad === 'Moodle' && c.modo_moodle)
      || (filtroModalidad === 'Coursera' && c.modo_coursera);
    const matchSearch = c.titulo.toLowerCase().includes(busqueda.toLowerCase());
    return matchMod && matchSearch;
  });

  return (
    <div className="catalogo-page">
      <section className="catalogo-hero">
        <div className="catalogo-hero-overlay" />
        <div className="catalogo-hero-content">
          <h1>Cursos</h1>
          <p>Aprende a tu ritmo en nuestra Aula Virtual — modalidad Moodle o Coursera.</p>
        </div>
      </section>

      <div className="container catalogo-body">
        <aside className="catalogo-filtros">
          <h3>Filtrar</h3>

          <div className="filtro-group">
            <label>Buscar</label>
            <div className="search-input">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Nombre del curso..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="filtro-group">
            <label>Modalidad</label>
            <div className="filtro-chips">
              {MODALIDADES.map((m) => (
                <button
                  key={m}
                  className={`chip ${filtroModalidad === m ? 'chip--active' : ''}`}
                  onClick={() => setFiltroModalidad(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="catalogo-grid-area">
          {loading && (
            <div className="catalogo-loading">
              <div className="spinner"></div>
              <p>Cargando cursos...</p>
            </div>
          )}

          {error && (
            <div className="catalogo-error">
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: '#dc3545' }} />
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchCursos}>Reintentar</button>
            </div>
          )}

          {!loading && !error && (
            <>
              <p className="catalogo-results">
                {filtered.length} curso{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
              </p>
              {filtered.length === 0 ? (
                <div className="catalogo-empty">
                  <i className="fa-solid fa-box-open" />
                  <p>No hay resultados para esa búsqueda.</p>
                </div>
              ) : (
                <div className="catalogo-grid">
                  {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Cursos;
