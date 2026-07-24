import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import StatItem from '@components/StatItem';
import { useCatalog } from '@context/CatalogContext';
import CourseCard from '@components/CourseCard';
import CloudinaryImage from '@components/ui/CloudinaryImage';
import { cloudinaryVideoUrl, cloudinaryUrl } from '@utils/cloudinary';
import './Home.css';

const videoBg = cloudinaryVideoUrl('video');

const Home = () => {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { destacados: featuredCourses } = useCatalog();

  const benefitsData = [
    { id: 1, icon: 'fa-regular fa-clock', text: 'Modalidades flexibles de aprendizaje, elige dónde y cuándo estudiar' },
    { id: 2, icon: 'fa-solid fa-graduation-cap', text: 'Certificados que reconocen competencias y conocimientos adquiridos' },
    { id: 3, icon: 'fa-solid fa-brain', text: 'Tecnología avanzada en el proceso de enseñanza aprendizaje' },
    { id: 4, icon: 'fa-solid fa-users-viewfinder', text: 'Crea conexiones significativas con profesionales dentro de tu grupo' },
  ];

  return (
    <div className="home-page">

      {/* HERO */}
      <section className="hero-section">
        <video autoPlay loop muted playsInline className="hero-video">
          <source src={videoBg} type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Especialistas en Formación y Capacitación Continua</h1>
          <p>Potencia tu perfil profesional con nuestras certificaciones avaladas.</p>
          <Link to="/certificaciones" className="cta-button">Ver Catálogo</Link>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="stats-section">
        <div className="container stats-grid">
          <StatItem end={15000} title="Personas Capacitadas" />
          <StatItem end={10000} title="Personas Certificadas" />
          <StatItem end={500}   title="Empresas Satisfechas" />
          <StatItem end={13}    title="Años de Experiencia" />
        </div>
      </section>

      {/* BENEFICIOS CON IMAGEN */}
      <section className="benefits-img-section">
        <div className="container">
          <h2 className="section-title left-align">
            Al estudiar en Campus Matsso cuentas con grandes beneficios
          </h2>
          <div className="benefits-wrapper">
            <div className="benefits-image-col">
              <CloudinaryImage
                publicId="banner"
                alt="Beneficios Campus Matsso"
                width={800}
                height={600}
                eager
              />
            </div>
            <div className="benefits-content-col">
              {benefitsData.map((b) => (
                <div key={b.id} className="benefit-row-item">
                  <div className="benefit-row-icon">
                    <i className={b.icon} />
                  </div>
                  <p>{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMAS BANNER */}
      <section className="programas-banner-section">
        <div className="container">
          <h2 className="section-title">Nuestros Programas</h2>
          <div className="programas-banner-grid">
            <Link to="/capacitaciones" className="programa-banner-card">
              <img
                src="https://res.cloudinary.com/ehglt8h8/image/upload/v1784928429/Capacitaciones.png"
                alt="Capacitaciones"
              />
              <div className="programa-banner-overlay" />
              <div className="programa-banner-content">
                <span className="programa-banner-label">PROGRAMAS</span>
                <h3>Capacitaciones</h3>
                <span className="programa-banner-cta">
                  Ver todos <i className="fa-solid fa-arrow-right" />
                </span>
              </div>
            </Link>
            <Link to="/certificaciones" className="programa-banner-card">
              <img
                src="https://res.cloudinary.com/ehglt8h8/image/upload/v1784928496/certificaciones.png"
                alt="Certificaciones"
                style={{ objectPosition: 'center bottom' }}
              />
              <div className="programa-banner-overlay" />
              <div className="programa-banner-content">
                <span className="programa-banner-label">PROGRAMAS</span>
                <h3>Certificaciones</h3>
                <span className="programa-banner-cta">
                  Ver todas <i className="fa-solid fa-arrow-right" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* DESTACADOS */}
      {featuredCourses.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <h2 className="section-title">Destacados</h2>
            <div className="home-featured-grid">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* POR QUÉ ELEGIRNOS */}
      <section className="why-section">
        <div className="container">
          <div className="why-grid">
            <div className="why-item">
              <i className="fa-solid fa-certificate" />
              <h3>Certificación Avalada</h3>
              <p>Nuestros cursos cuentan con respaldo institucional.</p>
            </div>
            <div className="why-item">
              <i className="fa-solid fa-chalkboard-user" />
              <h3>Expertos del Sector</h3>
              <p>Aprende de profesionales con años de experiencia real.</p>
            </div>
            <div className="why-item">
              <i className="fa-solid fa-laptop-file" />
              <h3>Modalidad Presencial</h3>
              <p>Evaluaciones presenciales con metodologías prácticas.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
