import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { cursosService } from '@api/cursosService';
import { authService } from '@api/authService';
import CloudinaryImage from '@components/ui/CloudinaryImage';
import { cloudinaryUrl } from '@utils/cloudinary';
import './CertificationDetail.css';

const CapacitacionDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const isLoggedIn  = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  const preloaded = location.state?.cert;
  const [cap, setCap]     = useState(preloaded || null);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError]     = useState(null);
  const [contactoForm, setContactoForm] = useState({
    nombre:   currentUser?.nombre   || '',
    email:    currentUser?.correo   || '',
    telefono: currentUser?.telefono || '',
  });
  const [sendingContacto, setSendingContacto] = useState(false);

  useEffect(() => {
    if (preloaded) return;
    setLoading(true);
    setError(null);
    cursosService.getCapacitacionBySlug(slug)
      .then(data => { setCap(data); setLoading(false); })
      .catch(() => { setError('Capacitación no encontrada.'); setLoading(false); });
  }, [slug, preloaded]);

  const handleAddToCart = () => {
    if (!cap) return;
    addToCart(cap);
    addToast(`"${cap.titulo}" añadido al carrito`, 'success');
  };

  const handleContactoChange = (e) =>
    setContactoForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleContactoSubmit = async (e) => {
    e.preventDefault();
    setSendingContacto(true);
    try {
      await cursosService.enviarContacto({
        ...contactoForm,
        mensaje: `Interesado en capacitación: ${cap?.titulo || slug}`
      });
      addToast('¡Mensaje enviado! Un asesor te contactará pronto.', 'success');
      setContactoForm({ nombre: '', email: '', telefono: '' });
    } catch {
      addToast('Error al enviar el mensaje. Inténtalo de nuevo.', 'error');
    } finally {
      setSendingContacto(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }} />
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Cargando...</p>
      </div>
    );
  }

  if (error || !cap) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <h2>Capacitación no encontrada</h2>
        <p style={{ color: '#6b7280', marginTop: '10px' }}>
          {error || `No existe una capacitación con el identificador "${slug}".`}
        </p>
        <Link
          to="/capacitaciones"
          style={{ display: 'inline-block', marginTop: '24px', padding: '8px 20px', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none' }}
        >
          Ver todas las capacitaciones
        </Link>
      </div>
    );
  }

  const competencias    = cap.competencias  || [];
  const habilidadesTeo  = cap.habilidades?.teoricas  || [];
  const habilidadesPrac = cap.habilidades?.practicas || [];
  const conocimientos   = cap.conocimientos || [];
  const dirigidoA       = cap.perfiles?.length
    ? cap.perfiles.join(', ')
    : cap.categoria || '';

  const requirements = cap.requirements || [
    { number: '01', title: 'Documentos Personales', desc: 'Cédula de Identidad y Papeleta de Votación.' },
    { number: '02', title: 'Educación', desc: 'Educación general básica.' },
    { number: '03', title: 'Disponibilidad', desc: 'Cumplir con el horario establecido para la capacitación.' },
    { number: '04', title: 'Inscripción', desc: 'Completar el proceso de inscripción y pago previo al inicio.' },
  ];

  return (
    <div className="certification-detail-page">

      {/* ── 1. HERO ── */}
      <section
        className="cert-hero"
        style={cap.cloudinaryNum
          ? { backgroundImage: `url('${cloudinaryUrl(`${cap.cloudinaryNum}_hero`, { width: 1920, height: 700 })}')` }
          : undefined}
      >
        <div className="cert-hero-overlay" />
        <div className="container cert-hero-container">
          <div className="cert-hero-content">
            <span className="cert-hero-eyebrow">CAPACITACIÓN</span>
            <h1>{cap.titulo}</h1>
            <p>
              Desarrolla nuevas competencias y potencia tu carrera profesional
              {cap.descripcion ? ` al ${cap.descripcion.replace(/\.$/, '').toLowerCase()}.` : '.'}
            </p>
            <button className="btn-leer-mas" onClick={handleAddToCart}>
              <i className="fa-solid fa-cart-plus" /> Añadir al carrito de compras
            </button>
          </div>

          {/* Formulario de contacto */}
          <div className="cert-hero-form">
            <h3>Quiero ser contactado por un asesor</h3>
            {!isLoggedIn ? (
              <>
                <p>Inicia sesión para que un asesor te contacte.</p>
                <Link
                  to="/login"
                  state={{ from: `/capacitacion/${cap?.slug || slug}` }}
                  className="btn-enviar"
                  style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}
                >
                  <i className="fa-regular fa-user" /> Iniciar Sesión
                </Link>
                <p style={{ marginTop: 10, fontSize: '0.85rem', opacity: 0.8 }}>
                  ¿No tienes cuenta?{' '}
                  <Link to="/login" state={{ tab: 'register' }} style={{ color: '#f7a600', fontWeight: 600 }}>
                    Regístrate gratis
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p>Envíanos tus datos y nos pondremos en contacto contigo.</p>
                <form onSubmit={handleContactoSubmit}>
                  <div className="form-group">
                    <label>Nombre</label>
                    <input type="text" name="nombre" value={contactoForm.nombre} onChange={handleContactoChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={contactoForm.email} onChange={handleContactoChange} required />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input type="tel" name="telefono" value={contactoForm.telefono} onChange={handleContactoChange} placeholder="Ej: 0991234567" />
                  </div>
                  <button type="submit" className="btn-enviar" disabled={sendingContacto}>
                    {sendingContacto ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. SOBRE LA CAPACITACIÓN ── */}
      <section className="cert-about">
        <div className="container">
          <h2 className="cert-section-title">Sobre la capacitación</h2>
          <div className="cert-about-text">
            <p>
              La capacitación profesional es el proceso formativo mediante el cual una persona
              adquiere, actualiza o refuerza los conocimientos, habilidades y destrezas necesarias
              para desempeñarse con eficiencia en su área de trabajo. Está orientada a elevar el
              rendimiento laboral y a impulsar el desarrollo personal y profesional de los
              participantes.
            </p>
            <p>
              Matsso Certificación y Capacitación Profesional diseña sus programas de capacitación
              con base en estándares nacionales e internacionales, con instructores calificados y
              metodologías prácticas que garantizan una experiencia de aprendizaje efectiva y
              aplicable desde el primer día.
            </p>
            <p>
              Al completar la capacitación en <strong>{cap.titulo}</strong>, obtendrás un certificado
              de participación que avala tu formación y respalda tu desarrollo profesional ante
              empleadores e instituciones.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. CARACTERÍSTICAS / DETALLES ── */}
      {cap.features && cap.features.length > 0 && (
        <section className="cert-features">
          <div className="container">
            <div className="features-grid">
              {cap.features.map((f, i) => (
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

      {/* ── 4. FORMACIÓN PROFESIONAL ── */}
      <section className="cert-target">
        <div className="target-wrapper">
          <div className="target-image">
            <CloudinaryImage
              publicId={cap.cloudinaryNum
                ? `${cap.cloudinaryNum}_izquierda`
                : undefined}
              alt={cap.titulo}
              width={700}
              height={520}
            />
          </div>
          <div className="target-content-box">
            <h3>Formación profesional de calidad</h3>
            {competencias.length > 0 && (
              <>
                <h4>Competencias que desarrollarás:</h4>
                <ol>
                  {competencias.map((c, i) => <li key={i}>{c}</li>)}
                </ol>
              </>
            )}
            {dirigidoA && (
              <>
                <h4>Dirigido a:</h4>
                <p>{dirigidoA}.</p>
              </>
            )}
            <button className="btn-contact-advisor" onClick={handleAddToCart}>
              <i className="fa-solid fa-cart-plus" /> Añadir al carrito de compras
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. HABILIDADES Y CONOCIMIENTOS ── */}
      {(habilidadesTeo.length > 0 || habilidadesPrac.length > 0 || conocimientos.length > 0) && (
        <section className="cert-skills-knowledge">
          <div className="container">
            <h2 className="cert-section-title">Habilidades y Conocimientos</h2>
            <div className="skills-grid">
              {(habilidadesTeo.length > 0 || habilidadesPrac.length > 0) && (
                <div className="skills-col">
                  <h3>Habilidades</h3>
                  {habilidadesTeo.length > 0 && (
                    <>
                      <h4 className="skills-subheading">Teóricas</h4>
                      <ul>{habilidadesTeo.map((h, i) => <li key={i}>{h}</li>)}</ul>
                    </>
                  )}
                  {habilidadesPrac.length > 0 && (
                    <>
                      <h4 className="skills-subheading">Prácticas</h4>
                      <ul>{habilidadesPrac.map((h, i) => <li key={i}>{h}</li>)}</ul>
                    </>
                  )}
                </div>
              )}
              {conocimientos.length > 0 && (
                <div className="skills-col">
                  <h3>Contenidos</h3>
                  <ul>{conocimientos.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. REQUISITOS ── */}
      <section className="cert-requirements">
        <div className="requirements-wrapper">
          <div className="requirements-content">
            <h2 className="cert-section-title left">Requisitos</h2>
            <div className="req-list">
              {requirements.map((req, i) => (
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
            <CloudinaryImage
              publicId={cap.cloudinaryNum
                ? `${cap.cloudinaryNum}_derecha`
                : undefined}
              alt={cap.titulo}
              width={700}
              height={520}
            />
          </div>
        </div>
      </section>

    </div>
  );
};

export default CapacitacionDetail;
