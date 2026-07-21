import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { cursosService } from '@api/cursosService';
import { useCatalog } from '@context/CatalogContext';
import './CertificationDetail.css';

const CertificationDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { getCertBySlug, loading: catalogLoading } = useCatalog();

  const preloaded = location.state?.cert;
  const [cert, setCert] = useState(preloaded || null);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState(null);
  const [contactoForm, setContactoForm] = useState({ nombre: '', email: '', telefono: '' });
  const [sendingContacto, setSendingContacto] = useState(false);

  useEffect(() => {
    if (preloaded) return;

    // Primero intenta desde el contexto (ya cargado, sin llamada a la API)
    const fromContext = getCertBySlug(slug);
    if (fromContext) { setCert(fromContext); setLoading(false); return; }

    // Si el contexto aún está cargando, esperar a que termine
    if (catalogLoading) return;

    // Fallback: el usuario entró directamente por URL y el contexto falló
    setLoading(true);
    setError(null);
    cursosService.getCertificacionBySlug(slug)
      .then(data => { setCert(data); setLoading(false); })
      .catch(() => { setError('Certificación no encontrada.'); setLoading(false); });
  }, [slug, preloaded, getCertBySlug, catalogLoading]);

  const handleAddToCart = () => {
    if (!cert) return;
    addToCart(cert);
    addToast(`"${cert.titulo}" añadido al carrito`, 'success');
  };

  const handleContactoChange = (e) =>
    setContactoForm(p => ({ ...p, [e.target.name]: e.target.value }));

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

  if (error || !cert) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <h2>Certificación no encontrada</h2>
        <p style={{ color: '#6b7280', marginTop: '10px' }}>
          {error || `No existe una certificación con el identificador "${slug}".`}
        </p>
        <Link
          to="/certificaciones"
          style={{ display: 'inline-block', marginTop: '24px', padding: '8px 20px', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none' }}
        >
          Ver todas las certificaciones
        </Link>
      </div>
    );
  }

  // ── Datos que vienen 100% de la API (base de datos) ──
  const competencias     = cert.competencias  || [];
  const habilidadesTeo   = cert.habilidades?.teoricas  || [];
  const habilidadesPrac  = cert.habilidades?.practicas || [];
  const conocimientos    = cert.conocimientos || [];
  const dirigidoA        = cert.perfiles?.length
    ? cert.perfiles.join(', ')
    : cert.categoria || '';

  // Requisitos: siempre empieza con Documentos Personales
  const buildRequirements = () => {
    const docBase = { number: '01', title: 'Documentos Personales', desc: 'Cédula de Identidad y Papeleta de Votación.' };
    const apiReqs = cert.requirements || [];
    const yaIncluye = apiReqs.length > 0 && apiReqs[0].title?.toLowerCase().includes('document');
    if (yaIncluye) return apiReqs.map((r, i) => ({ ...r, number: String(i + 1).padStart(2, '0') }));
    return [docBase, ...apiReqs.map((r, i) => ({ ...r, number: String(i + 2).padStart(2, '0') }))];
  };
  const requirements = buildRequirements();


  return (
    <div className="certification-detail-page">

      {/* ── 1. PORTADA / HERO ── */}
      <section
        className="cert-hero"
        style={cert.imagen ? { backgroundImage: `url('${cert.imagen}')` } : undefined}
      >
        <div className="cert-hero-overlay" />
        <div className="container cert-hero-container">
          <div className="cert-hero-content">
            <span className="cert-hero-eyebrow">CERTIFICACIÓN</span>
            <h1>{cert.titulo}</h1>
            <p>
              La Certificación reconoce tus habilidades, conocimientos y experiencia
              {cert.descripcion ? ` al ${cert.descripcion.replace(/\.$/, '').toLowerCase()}.` : '.'}
            </p>
            <button className="btn-leer-mas" onClick={handleAddToCart}>
              <i className="fa-solid fa-cart-plus" /> Añadir al carrito de compras
            </button>
          </div>

          {/* Formulario de contacto */}
          <div className="cert-hero-form">
            <h3>Quiero ser contactado por un asesor</h3>
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

      {/* ── 2. SOBRE LA CERTIFICACIÓN ── */}
      <section className="cert-about">
        <div className="container">
          <h2 className="cert-section-title">Sobre la certificación</h2>
          <div className="cert-about-text">
            <p>
              La certificación de cualificaciones o competencias laborales es el procedimiento
              mediante el cual un organismo, reconocido por la Subsecretaría de Cualificaciones
              Profesionales del Ministerio del Trabajo, determina formalmente que una persona ha
              alcanzado el desempeño esperado, y ha demostrado contar con los conocimientos,
              destrezas, aptitudes y habilidades, conforme a un estándar ocupacional o a una
              Norma de Certificación de Cualificación.
            </p>
            <p>
              La Subsecretaría de Cualificaciones Profesionales y Gestión Artesanal del
              Ministerio del Trabajo, luego de un proceso riguroso de evaluación, reconoce a
              Matsso Certificación y Capacitación Profesional, para que actúe como Organismo
              Evaluador de Conformidad (OEC), a fin de que otorgue la certificación de personas
              en una o varias unidades de competencia.
            </p>
            <p>
              Para conseguir la Certificación en <strong>{cert.titulo}</strong>, deberás cumplir
              con los requisitos detallados en esta página web y pasar por un proceso de
              Evaluación Teórico y Práctico.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. VIGENCIA / MODALIDAD / EVALUACIONES — datos de matsso.vigencia, matsso.evaluacion, public.productos ── */}
      {cert.features && cert.features.length > 0 && (
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

      {/* ── 4. RECONOCIMIENTO PROFESIONAL ── */}
      <section className="cert-target">
        <div className="target-wrapper">
          <div className="target-image">
            {cert.imagen && <img src={cert.imagen} alt={cert.titulo} />}
          </div>
          <div className="target-content-box">
            <h3>Reconocimiento profesional que mereces</h3>
            {competencias.length > 0 && (
              <>
                <h4>Competencias Laborales:</h4>
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

      {/* ── 5. HABILIDADES Y CONOCIMIENTOS — datos de matsso.habilidad y matsso.conocimiento ── */}
      {(habilidadesTeo.length > 0 || habilidadesPrac.length > 0 || conocimientos.length > 0) && (
        <section className="cert-skills-knowledge">
          <div className="container">
            <h2 className="cert-section-title">Habilidades y Conocimientos Requeridos</h2>
            <div className="skills-grid">
              {(habilidadesTeo.length > 0 || habilidadesPrac.length > 0) && (
                <div className="skills-col">
                  <h3>Habilidades Evaluables</h3>
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
                  <h3>Conocimientos Requeridos</h3>
                  <ul>{conocimientos.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. REQUISITOS — datos de matsso.requisito ── */}
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
            {cert.imagen && <img src={cert.imagen} alt={cert.titulo} />}
          </div>
        </div>
      </section>

    </div>
  );
};

export default CertificationDetail;
