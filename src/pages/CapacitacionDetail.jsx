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

  const heroStyle = cap.cloudinaryNum
    ? { backgroundImage: `url('${cloudinaryUrl(`${cap.cloudinaryNum}_hero`, { width: 1920, height: 700 })}')` }
    : undefined;

  const formBgStyle = cap.cloudinaryNum
    ? { backgroundImage: `url('${cloudinaryUrl(`${cap.cloudinaryNum}_hero`, { width: 1920, height: 700 })}')` }
    : undefined;

  const hasMetodologias = habilidadesTeo.length > 0 || habilidadesPrac.length > 0;
  const hasCompetencias = competencias.length > 0 || conocimientos.length > 0 || dirigidoA;

  return (
    <div className="certification-detail-page">

      {/* ── 1. HERO: imagen + CAPACITACIÓN / nombre ── */}
      <section className="cert-hero cap-hero" style={heroStyle}>
        <div className="cert-hero-overlay" />
        <div className="container cap-hero-text">
          <span className="cert-hero-eyebrow">CAPACITACIÓN</span>
          <h1>{cap.titulo}</h1>
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

      {/* ── 3. INFO (izq) + DESCRIPCIÓN (centro) + IMAGEN sticky (der) ── */}
      <section className="cap-info-section">
        <div className="container">
          <div className="cap-info-grid">

            {/* Columna izquierda: info + contacto */}
            <div className="cap-left-cards">
              <div className="cap-info-card">
                <h3 className="cap-card-title">Información</h3>
                {(cap.features || []).map((f, i) => (
                  <div className="cap-info-item" key={i}>
                    <i className={f.icon} />
                    <span>{f.desc || f.title}</span>
                  </div>
                ))}
              </div>

              <div className="cap-contact-card">
                <h3 className="cap-card-title">Inscribirse</h3>
                <div className="cap-contact-item">
                  <i className="fa-solid fa-envelope" />
                  <span>matssoecuador@gmail.com</span>
                </div>
                <div className="cap-contact-item">
                  <i className="fa-solid fa-phone" />
                  <span>0999 720 877</span>
                </div>
                <div className="cap-contact-item">
                  <i className="fa-brands fa-whatsapp" />
                  <span>0986 802 988</span>
                </div>
                <button className="btn-leer-mas cap-cart-btn" onClick={handleAddToCart}>
                  <i className="fa-solid fa-cart-shopping" /> Añadir al carrito de compras
                </button>
              </div>
            </div>

            {/* Columna centro: descripción */}
            <div className="cap-desc-col">
              <h2 className="cap-section-heading">Descripción</h2>
              {(cap.descripcion_larga || cap.descripcion) && (
                (cap.descripcion_larga || cap.descripcion)
                  .split('\n')
                  .filter(p => p.trim())
                  .map((p, i) => (
                    <p key={i} className="cap-desc-text">{p}</p>
                  ))
              )}
            </div>

            {/* Columna derecha: imagen sticky */}
            {cap.cloudinaryNum && (
              <div className="cap-sticky-img-col">
                <div className="cap-sticky-img-frame">
                  <img
                    src={`https://res.cloudinary.com/ehglt8h8/image/upload/f_auto,q_auto,w_500/${cap.cloudinaryNum}_derecha`}
                    alt={cap.titulo}
                    className="cap-sticky-img"
                  />
                  <div className="cap-sticky-img-bar" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. IMAGEN (izq) + METODOLOGÍAS Y OBJETIVOS (der) ── */}
      {hasMetodologias && (
        <section className="cap-split-section">
          <div className="cap-split-grid">
            <div className="cap-split-image-col">
              <CloudinaryImage
                publicId={cap.cloudinaryNum ? `${cap.cloudinaryNum}_izquierda` : undefined}
                alt={cap.titulo}
                width={700}
                height={520}
              />
            </div>
            <div className="cap-split-content-col cap-split-bg-white">
              <h2 className="cap-section-heading">Metodologías y Objetivos</h2>
              {habilidadesTeo.length > 0 && (
                <>
                  <h4 className="cap-sub-heading">Metodologías</h4>
                  <ul className="cap-list">
                    {habilidadesTeo.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </>
              )}
              {habilidadesPrac.length > 0 && (
                <>
                  <h4 className="cap-sub-heading">Objetivos</h4>
                  <ul className="cap-list">
                    {habilidadesPrac.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
        </section>
      )}


      {/* ── 7. FORMULARIO con imagen de fondo ── */}
      <section className="cap-form-section" style={formBgStyle}>
        <div className="cap-form-overlay" />
        <div className="cap-form-wrapper">
          <div className="cert-hero-form cap-form-box">
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

    </div>
  );
};

export default CapacitacionDetail;