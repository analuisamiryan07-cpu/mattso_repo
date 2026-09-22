import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { cursosService } from '@api/cursosService';
import CloudinaryImage from '@components/ui/CloudinaryImage';
import { cloudinaryUrl } from '@utils/cloudinary';
import './CertificationDetail.css';

// Detalle de un curso del Aula Virtual (Moodle/Coursera). Mismas clases CSS
// que CapacitacionDetail — es el mismo look, el mismo flujo de compra
// (carrito → orden → pago) y las mismas 3 imágenes de Cloudinary
// (hero/izquierda/derecha), solo que la carpeta es por curso, no un número.
const AULA_VIRTUAL_URL = import.meta.env.VITE_AULA_VIRTUAL_URL || 'https://aula.sapper-industries.com';

const CursoDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const preloaded = location.state?.cert;
  const [curso, setCurso] = useState(preloaded || null);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preloaded) return;
    setLoading(true);
    setError(null);
    cursosService.getCursoLmsBySlug(slug)
      .then((data) => { setCurso(data); setLoading(false); })
      .catch(() => { setError('Curso no encontrado.'); setLoading(false); });
  }, [slug, preloaded]);

  const handleAddToCart = () => {
    if (!curso) return;
    addToCart(curso);
    addToast(`"${curso.titulo}" añadido al carrito`, 'success');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }} />
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Cargando...</p>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <h2>Curso no encontrado</h2>
        <p style={{ color: '#6b7280', marginTop: '10px' }}>
          {error || `No existe un curso con el identificador "${slug}".`}
        </p>
        <Link
          to="/cursos"
          style={{ display: 'inline-block', marginTop: '24px', padding: '8px 20px', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none' }}
        >
          Ver todos los cursos
        </Link>
      </div>
    );
  }

  const folder = curso.cursoCloudinaryFolder;
  const heroStyle = folder
    ? { backgroundImage: `url('${cloudinaryUrl(`${folder}/hero`, { width: 1920, height: 700 })}')` }
    : undefined;

  const modalidades = [
    curso.modo_moodle && 'Moodle',
    curso.modo_coursera && 'Coursera',
  ].filter(Boolean).join(' y ');

  return (
    <div className="certification-detail-page">
      {/* HERO */}
      <section className="cert-hero cap-hero" style={heroStyle}>
        <div className="cert-hero-overlay" />
        <div className="container cap-hero-text">
          <span className="cert-hero-eyebrow">CURSO — AULA VIRTUAL</span>
          <h1>{curso.titulo}</h1>
        </div>
      </section>

      {/* SOBRE EL CURSO */}
      <section className="cert-about">
        <div className="container">
          <h2 className="cert-section-title">Sobre el curso</h2>
          <div className="cert-about-text">
            <p>
              Este curso se toma desde nuestra Aula Virtual{modalidades ? ` (modalidad ${modalidades})` : ''}.
              Después de inscribirte, tu acceso se activa cuando ingresas al Aula Virtual con la clave que
              te enviamos por correo — desde ahí cuenta el tiempo de tu acceso, no desde el día de la compra.
            </p>
            <p>
              Sapper Industries diseña sus cursos con instructores calificados y contenido práctico,
              pensado para que avances a tu propio ritmo.
            </p>
          </div>
        </div>
      </section>

      {/* INFO + DESCRIPCIÓN + PANEL DERECHO */}
      <section className="cap-info-section">
        <div className="cap-info-outer">
          <div className="cap-info-left">
            <div className="cap-info-grid">
              <div className="cap-left-cards">
                <div className="cap-info-card">
                  <h3 className="cap-card-title">Información</h3>
                  <div className="cap-info-item">
                    <i className="fa-solid fa-dollar-sign" />
                    <span>${curso.precio?.toFixed(2)} (dólares)</span>
                  </div>
                  {curso.horas && (
                    <div className="cap-info-item">
                      <i className="fa-regular fa-clock" />
                      <span>{curso.horas}</span>
                    </div>
                  )}
                  <div className="cap-info-item">
                    <i className="fa-solid fa-screwdriver-wrench" />
                    <span>{curso.modalidad || 'Virtual'}</span>
                  </div>
                  {modalidades && (
                    <div className="cap-info-item">
                      <i className="fa-solid fa-graduation-cap" />
                      <span>Disponible en: {modalidades}</span>
                    </div>
                  )}
                </div>

                <div className="cap-contact-card">
                  <h3 className="cap-card-title">Inscribirse</h3>
                  <div className="cap-contact-item">
                    <i className="fa-solid fa-envelope" />
                    <span>info@sapper-industries.com</span>
                  </div>
                  <div className="cap-contact-item">
                    <i className="fa-brands fa-whatsapp" />
                    <span>0986 802 988</span>
                  </div>
                  <button className="btn-leer-mas cap-cart-btn" onClick={handleAddToCart}>
                    <i className="fa-solid fa-cart-shopping" /> Añadir al carrito de compras
                  </button>
                  <a
                    href={AULA_VIRTUAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-leer-mas cap-cart-btn"
                    style={{ marginTop: 8, display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" /> Ir al Aula Virtual
                  </a>
                </div>
              </div>

              <div className="cap-desc-col">
                <h2 className="cap-section-heading">Descripción</h2>
                {(curso.descripcion_larga || curso.descripcion) && (
                  (curso.descripcion_larga || curso.descripcion)
                    .split('\n')
                    .filter((p) => p.trim())
                    .map((p, i) => <p key={i} className="cap-desc-text">{p}</p>)
                )}
              </div>
            </div>
          </div>

          {folder && (
            <div
              className="cap-img-right-panel"
              style={{ backgroundImage: `url('${cloudinaryUrl(`${folder}/derecha`, { width: 700 })}')` }}
              aria-label={curso.titulo}
            >
              <div className="cap-img-right-bar" />
            </div>
          )}
        </div>
      </section>

      {/* IMAGEN IZQUIERDA */}
      {folder && (
        <section className="cap-split-section">
          <div className="cap-split-grid">
            <div className="cap-split-image-col">
              <CloudinaryImage publicId={`${folder}/izquierda`} alt={curso.titulo} width={700} height={520} />
            </div>
            <div className="cap-split-content-col cap-split-bg-white">
              <h2 className="cap-section-heading">¿Cómo funciona?</h2>
              <ul className="cap-list">
                <li>Compras el curso y tu orden queda pendiente de confirmación.</li>
                <li>Cuando se confirma el pago, te llega tu clave de acceso al correo.</li>
                <li>Entras al Aula Virtual con tu usuario y contraseña, y activas el curso con esa clave.</li>
                <li>Tu acceso dura {curso.duracion_meses ? `${curso.duracion_meses} meses` : 'un tiempo limitado'} desde que lo activas.</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CursoDetail;
