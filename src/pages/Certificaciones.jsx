import React, { useState } from 'react';
import CourseCard from '@components/CourseCard';
import { useCatalog } from '@context/CatalogContext';
import './Catalogo.css';

const Certificaciones = () => {
  const { certificaciones, loading } = useCatalog();
  const error = null;
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  const categorias = ['Todas', ...new Set(certificaciones.map((c) => c.categoria))].sort();
  const modalidades = ['Todas', ...new Set(certificaciones.map((c) => c.modalidad).filter(Boolean))].sort();

  const filtered = certificaciones.filter((c) => {
    const matchMod = filtroModalidad === 'Todas' || c.modalidad === filtroModalidad;
    const matchCat = filtroCategoria === 'Todas' || c.categoria === filtroCategoria;
    const matchSearch = c.titulo.toLowerCase().includes(busqueda.toLowerCase());
    return matchMod && matchCat && matchSearch;
  });

  return (
    <div className="catalogo-page">

      <section className="catalogo-hero catalogo-hero--cert">
        <div className="catalogo-hero-overlay" />
        <div className="catalogo-hero-content">
          <h1>Certificaciones</h1>
          <p>Certifica tus competencias con el respaldo del Ministerio del Trabajo del Ecuador.</p>
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
                placeholder="Nombre de la certificación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="filtro-group">
            <label>Modalidad</label>
            <div className="filtro-chips">
              {modalidades.map((m) => (
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

        <main className="catalogo-grid-area">
          {loading ? (
            <div className="catalogo-empty">
              <i className="fa-solid fa-circle-notch fa-spin" />
              <p>Cargando certificaciones...</p>
            </div>
          ) : error ? (
            <div className="catalogo-empty">
              <i className="fa-solid fa-triangle-exclamation" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              <p className="catalogo-results">
                {filtered.length} certificación{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
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

export default Certificaciones;
