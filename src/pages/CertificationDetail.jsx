import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { cursosService } from '@api/cursosService';
import './CertificationDetail.css';

const CertificationDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de contacto asesor
  const [contactoForm, setContactoForm] = useState({ nombre: '', email: '', telefono: '' });
  const [sendingContacto, setSendingContacto] = useState(false);

  const fetchCertDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cursosService.getCertificacionBySlug(slug);
      if (data) {
        setCert(data);
      } else {
        throw new Error('Certificación no encontrada en la base de datos.');
      }
    } catch (err) {
      console.error('Error fetching certification detail:', err);
      setError('No se pudo cargar la información de la certificación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertDetail();
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid rgba(0,33,71,0.1)', borderLeftColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Cargando información de la certificación...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <h2>Certificación no encontrada</h2>
        <p style={{ color: '#6b7280', marginTop: '10px' }}>
          {error || `No existe una certificación con el identificador "${slug}".`}
        </p>
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={fetchCertDetail} className="retry-btn" style={{ padding: '8px 20px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
            Reintentar
          </button>
          <Link to="/certificaciones" style={{ padding: '8px 20px', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none' }}>
            Ver todas
          </Link>
        </div>
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
