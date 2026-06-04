import React, { useState, useEffect } from 'react';
import CourseCard from '@components/CourseCard';
import { cursosService } from '@api/cursosService';
import './Catalogo.css';

const MODALIDADES = ['Todas', 'Virtual', 'Presencial'];

const Capacitaciones = () => {
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState(['Todas']);
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCursos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cursosService.getCapacitaciones();
      if (Array.isArray(data)) {
        setCursos(data);
        setCategorias(['Todas', ...new Set(data.map(c => c.categoria))]);
      } else {
        throw new Error('La respuesta del servidor no es un catálogo válido.');
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError('No se pudo cargar la lista de capacitaciones. Por favor, verifica tu conexión o vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const filtered = cursos.filter((c) => {
    const matchMod = filtroModalidad === 'Todas' || c.modalidad === filtroModalidad;
    const matchCat = filtroCategoria === 'Todas' || c.categoria === filtroCategoria;
    const matchSearch = c.titulo.toLowerCase().includes(busqueda.toLowerCase());
    return matchMod && matchCat && matchSearch;
  });

  return (
    <div className="catalogo-page">

      {/* HERO */}
      <section className="catalogo-hero">
        <div className="catalogo-hero-overlay" />
        <div className="catalogo-hero-content">
          <h1>Capacitaciones</h1>
          <p>Fortalece tus competencias con nuestros cursos avalados por el Ministerio del Trabajo.</p>
        </div>
      </section>

      <div className="container catalogo-body">

        {/* FILTROS */}
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

          <div className="filtro-group">
            <label>Categoría</label>
            <div className="filtro-chips">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  className={`chip ${filtroCategoria === cat ? 'chip--active' : ''}`}
                  onClick={() => setFiltroCategoria(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* GRID */}
        <main className="catalogo-grid-area">
          {loading && (
            <div className="catalogo-loading">
              <div className="spinner"></div>
              <p>Cargando capacitaciones...</p>
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
                {filtered.length} capacitación{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
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

export default Capacitaciones;
