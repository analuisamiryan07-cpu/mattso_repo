import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import StatItem from '@components/StatItem';
import './Home.css';
import videoBg from '../../recursos/imagenes/inicio/demostracion.mp4';
import { capacitacionesMock } from '@data/capacitaciones';

const Home = () => {
  const { addToCart } = useCart();
  const { addToast } = useToast();

  // Solo mostramos los primeros 3 cursos como "destacados"
  const featuredCourses = capacitacionesMock.slice(0, 3);

  const benefitsData = [
    { id: 1, icon: 'fa-regular fa-clock', text: 'Modalidades flexibles de aprendizaje, elige dónde y cuándo estudiar' },
    { id: 2, icon: 'fa-solid fa-graduation-cap', text: 'Certificados que reconocen competencias y conocimientos adquiridos' },
    { id: 3, icon: 'fa-solid fa-brain', text: 'Tecnología avanzada en el proceso de enseñanza aprendizaje' },
    { id: 4, icon: 'fa-solid fa-users-viewfinder', text: 'Crea conexiones significativas con profesionales dentro de tu grupo' },
  ];

  const handleAddToCart = (course) => {
    addToCart(course);
    addToast(`"${course.titulo}" añadido al carrito`, 'success');
  };

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
          <Link to="/capacitaciones" className="cta-button">Ver Catálogo</Link>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="stats-section">
        <div className="container stats-grid">
          <StatItem end={15000} title="Personas Capacitadas" />
          <StatItem end={10000} title="Personas Certificadas" />
          <StatItem end={500}   title="Empresas Satisfechas" />
          <StatItem end={10}    title="Años de Experiencia" />
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
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
                alt="Beneficios Campus Matsso"
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

      {/* CURSOS DESTACADOS */}
      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">Capacitaciones Destacadas</h2>
          <div className="courses-grid">
            {featuredCourses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-image">
                  <img src={course.imagen} alt={course.titulo} />
                  <span className="course-badge">{course.categoria}</span>
                </div>
                <div className="course-info">
                  <h3>{course.titulo}</h3>
                  <p className="course-price">${course.precio.toFixed(2)}</p>
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(course)}>
                    <i className="fa-solid fa-cart-plus" /> Agregar al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              <h3>Modalidad Virtual</h3>
              <p>Estudia a tu propio ritmo, desde cualquier lugar.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
