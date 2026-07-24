import React from 'react';
import { Link } from 'react-router-dom';
import StatItem from '@components/StatItem';
import './Nosotros.css';

const valores = [
  { icon: 'fa-solid fa-shield-halved',   title: 'Integridad',        desc: 'Actuamos con honestidad y transparencia en cada proceso de evaluación y certificación.' },
  { icon: 'fa-solid fa-star',            title: 'Excelencia',        desc: 'Aplicamos los más altos estándares de calidad en nuestros servicios y metodologías.' },
  { icon: 'fa-solid fa-handshake',       title: 'Compromiso',        desc: 'Acompañamos a cada profesional y empresa en su camino hacia la certificación laboral.' },
  { icon: 'fa-solid fa-lightbulb',       title: 'Innovación',        desc: 'Incorporamos tecnología y metodologías actualizadas para una experiencia de aprendizaje moderna.' },
  { icon: 'fa-solid fa-users',           title: 'Responsabilidad',   desc: 'Contribuimos al desarrollo profesional del Ecuador y al crecimiento del capital humano nacional.' },
  { icon: 'fa-solid fa-globe',           title: 'Impacto Social',    desc: 'Generamos valor en individuos, empresas y comunidades a través de la cualificación profesional.' },
];

const servicios = [
  {
    icon: 'fa-solid fa-certificate',
    title: 'Certificación de Competencias',
    desc: 'Evaluamos y certificamos competencias laborales bajo la supervisión del Ministerio del Trabajo del Ecuador, reconociendo formalmente las habilidades y conocimientos de cada profesional.',
    link: '/certificaciones',
    linkText: 'Ver certificaciones',
  },
  {
    icon: 'fa-solid fa-chalkboard-user',
    title: 'Capacitación Profesional',
    desc: 'Ofrecemos programas de capacitación presencial y virtual diseñados para potenciar las habilidades técnicas y transversales de trabajadores y empresas en diversos sectores.',
    link: '/capacitaciones',
    linkText: 'Ver capacitaciones',
  },
  {
    icon: 'fa-solid fa-building',
    title: 'Capacitación Empresarial',
    desc: 'Desarrollamos planes de formación a la medida de las necesidades de cada organización, fortaleciendo el talento interno y mejorando el rendimiento corporativo.',
    link: '/contacto',
    linkText: 'Solicitar información',
  },
];

const Nosotros = () => {
  return (
    <div className="nosotros-page">

      {/* ── HERO ── */}
      <section className="nosotros-hero">
        <div className="nosotros-hero-overlay" />
        <div className="nosotros-hero-content container">
          <span className="nosotros-eyebrow">SOBRE NOSOTROS</span>
          <h1>Líderes en Certificación y Capacitación Profesional en Ecuador</h1>
          <p>
            Somos un Organismo Evaluador de Conformidad (OEC) acreditado por la Subsecretaría de
            Cualificaciones Profesionales del Ministerio del Trabajo, comprometidos con el desarrollo
            del talento humano ecuatoriano.
          </p>
          <div className="nosotros-hero-actions">
            <Link to="/certificaciones" className="btn-primary-nos">Ver Certificaciones</Link>
            <Link to="/contacto" className="btn-secondary-nos">Contáctanos</Link>
          </div>
        </div>
      </section>

      {/* ── ESTADÍSTICAS ── */}
      <section className="nosotros-stats">
        <div className="container stats-grid">
          <StatItem end={15000} title="Personas Capacitadas" />
          <StatItem end={10000} title="Personas Certificadas" />
          <StatItem end={500}   title="Empresas Satisfechas" />
          <StatItem end={10}    title="Años de Experiencia" />
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section className="nosotros-quienes">
        <div className="container nosotros-quienes-grid">
          <div className="nosotros-quienes-text">
            <span className="nos-section-label">¿QUIÉNES SOMOS?</span>
            <h2>MATSSO Ecuador: Organismo Evaluador de Conformidad</h2>
            <p>
              MATSSO Certificación y Capacitación Profesional es una empresa ecuatoriana con más de
              10 años de experiencia en el desarrollo del capital humano. Somos reconocidos por la
              Subsecretaría de Cualificaciones Profesionales y Gestión Artesanal del Ministerio del
              Trabajo como Organismo Evaluador de Conformidad (OEC).
            </p>
            <p>
              Nuestra misión es brindar servicios de evaluación, certificación y capacitación de
              alta calidad que contribuyan al progreso profesional de las personas y al fortalecimiento
              productivo del Ecuador. Contamos con un equipo multidisciplinario de evaluadores
              certificados y metodologías alineadas a los estándares nacionales e internacionales.
            </p>
            <p>
              Trabajamos con más de 500 empresas y hemos contribuido a la certificación de más de
              10,000 profesionales en 49 áreas ocupacionales, abarcando sectores tan diversos como
              energía eléctrica, salud, gastronomía, tecnología, construcción y más.
            </p>
          </div>
          <div className="nosotros-quienes-cards">
            <div className="nos-card nos-card--mision">
              <i className="fa-solid fa-bullseye" />
              <h3>Misión</h3>
              <p>
                Brindar servicios de certificación y capacitación profesional de excelencia,
                reconociendo y fortaleciendo las competencias laborales de los trabajadores
                ecuatorianos, contribuyendo así al desarrollo productivo del país.
              </p>
            </div>
            <div className="nos-card nos-card--vision">
              <i className="fa-solid fa-eye" />
              <h3>Visión</h3>
              <p>
                Ser el Organismo Evaluador de Conformidad líder en el Ecuador, referente en
                calidad y cobertura de certificación laboral, reconocido nacional e
                internacionalmente por su contribución al desarrollo del talento humano.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section className="nosotros-servicios">
        <div className="container">
          <span className="nos-section-label center">NUESTROS SERVICIOS</span>
          <h2 className="nos-section-title">¿Qué ofrecemos?</h2>
          <div className="nosotros-servicios-grid">
            {servicios.map((s) => (
              <div key={s.title} className="nos-servicio-card">
                <div className="nos-servicio-icon">
                  <i className={s.icon} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <Link to={s.link} className="nos-servicio-link">
                  {s.linkText} <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALORES ── */}
      <section className="nosotros-valores">
        <div className="container">
          <span className="nos-section-label center">NUESTROS VALORES</span>
          <h2 className="nos-section-title">Los principios que nos guían</h2>
          <div className="nosotros-valores-grid">
            {valores.map((v) => (
              <div key={v.title} className="nos-valor-card">
                <div className="nos-valor-icon">
                  <i className={v.icon} />
                </div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECONOCIMIENTOS ── */}
      <section className="nosotros-reconocimientos">
        <div className="container">
          <span className="nos-section-label center">RESPALDO OFICIAL</span>
          <h2 className="nos-section-title">Acreditados por el Estado Ecuatoriano</h2>
          <div className="nosotros-recono-grid">
            <div className="nos-recono-item">
              <div className="nos-recono-icon">
                <i className="fa-solid fa-landmark" />
              </div>
              <div>
                <h4>Ministerio del Trabajo</h4>
                <p>Acreditados como OEC por la Subsecretaría de Cualificaciones Profesionales y Gestión Artesanal.</p>
              </div>
            </div>
            <div className="nos-recono-item">
              <div className="nos-recono-icon">
                <i className="fa-solid fa-scale-balanced" />
              </div>
              <div>
                <h4>Marco Nacional de Cualificaciones</h4>
                <p>Nuestras certificaciones están alineadas al Marco Nacional de Cualificaciones (MNC) del Ecuador.</p>
              </div>
            </div>
            <div className="nos-recono-item">
              <div className="nos-recono-icon">
                <i className="fa-solid fa-file-shield" />
              </div>
              <div>
                <h4>Normas de Certificación Oficiales</h4>
                <p>Evaluamos con base en Normas de Certificación de Cualificación (NCQ) aprobadas por la autoridad competente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="nosotros-cta">
        <div className="container nosotros-cta-inner">
          <h2>¿Listo para certificar tus competencias?</h2>
          <p>
            Únete a los miles de profesionales que han confiado en MATSSO para impulsar su carrera.
            Revisa nuestro catálogo de certificaciones o contáctanos para más información.
          </p>
          <div className="nosotros-cta-actions">
            <Link to="/certificaciones" className="btn-primary-nos">Ver todas las certificaciones</Link>
            <Link to="/contacto" className="btn-secondary-nos">Habla con un asesor</Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Nosotros;
