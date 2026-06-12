import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { cursosService } from '@api/cursosService';
import { certificacionesMock } from '@data/certificaciones';
import './CertificationDetail.css';

const CertificationDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [cert, setCert] = useState(() => certificacionesMock.find((c) => c.slug === slug) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [contactoForm, setContactoForm] = useState({ nombre: '', email: '', telefono: '' });
  const [sendingContacto, setSendingContacto] = useState(false);

  useEffect(() => {
    const found = certificacionesMock.find((c) => c.slug === slug);
    if (found) {
      setCert(found);
    } else {
      setError('Certificación no encontrada.');
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (!cert) return;
    addToCart(cert);
    addToast(`"${cert.titulo}" añadido al carrito`, 'success');
  };

  const handleContactoChange = (e) => {
    setContactoForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleContactoSubmit = async (e) => {
    e.preventDefault();
    setSendingContacto(true);
    try {
      await cursosService.enviarContacto({
        ...contactoForm,
        mensaje: `Interesado en certificación: ${cert?.titulo || slug}`
      });
      addToast('¡Mensaje enviado! Un asesor te contactará pronto.', 'success');
      setContactoForm({ nombre: '', email: '', telefono: '' });
    } catch (err) {
      addToast('Error al enviar el mensaje. Inténtalo de nuevo.', 'error');
    } finally {
      setSendingContacto(false);
    }
  };

  if (error || !cert) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <h2>Certificación no encontrada</h2>
        <p style={{ color: '#6b7280', marginTop: '10px' }}>
          {error || `No existe una certificación con el identificador "${slug}".`}
        </p>
        <Link to="/certificaciones" style={{ display: 'inline-block', marginTop: '24px', padding: '8px 20px', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none' }}>
          Ver todas las certificaciones
        </Link>
      </div>
    );
  }

  return (
    <div className="certification-detail-page">

      {/* 1. HERO */}
      <section className="cert-hero">
        <div className="cert-hero-overlay" />
        <div className="container cert-hero-container">
          <div className="cert-hero-content">
            <h1>{cert.titulo}</h1>
            <p>{cert.shortDescription || cert.descripcion}</p>
            <button className="btn-leer-mas" onClick={handleAddToCart}>
              <i className="fa-solid fa-cart-plus" /> Inscribirme
            </button>
          </div>
          <div className="cert-hero-form">
            <h3>Quiero ser contactado por un asesor</h3>
            <p>Envíanos tus datos y nos pondremos en contacto contigo.</p>
            <form onSubmit={handleContactoSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={contactoForm.nombre}
                  onChange={handleContactoChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={contactoForm.email}
                  onChange={handleContactoChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={contactoForm.telefono}
                  onChange={handleContactoChange}
                  placeholder="Ej: 0991234567"
                />
              </div>
              <div className="form-checkbox">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">Acepto los <u>Términos y Condiciones</u></label>
              </div>
              <button type="submit" className="btn-enviar" disabled={sendingContacto}>
                {sendingContacto ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. SOBRE LA CERTIFICACIÓN */}
      {cert.about && (
        <section className="cert-about">
          <div className="container">
            <h2 className="cert-section-title">Sobre la certificación</h2>
            <div className="cert-about-text">
              {cert.about.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </section>
      )}

      {/* 3. CARACTERÍSTICAS CLAVE */}
      {cert.features && (
        <section className="cert-features">
          <div className="container">
            <div className="features-grid">
              {cert.features.map((f, i) => (
                <div className="feature-item" key={i}>
                  <i className={f.icon} />
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. REQUISITOS */}
      {cert.requirements && (
        <section className="cert-requirements">
          <div className="requirements-wrapper">
            <div className="requirements-content">
              <h2 className="cert-section-title left">Requisitos</h2>
              <div className="req-list">
                {cert.requirements.map((req, i) => (
                  <div className="req-item" key={i}>
                    <div className="req-number">{req.number}</div>
                    <div className="req-text">
                      <h4>{req.title}</h4>
                      <p>{req.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="requirements-image">
              <img
                src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=800&q=80"
                alt="Profesionales Matsso"
              />
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default CertificationDetail;
