import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import './Header.css';
// Importamos el logo local para que cargue inmediatamente sin saltos ni roturas
import logoImg from '../../../recursos/logo_matsso_qhse_raw.png';

const Header = () => {
  const { getCartCount } = useCart();

  // Estado para controlar si el menú de celulares está abierto o cerrado
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estado para saber si el usuario ha bajado la página (scroll) y cambiar a blanco
  const [scrolled, setScrolled] = useState(typeof window !== 'undefined' ? window.scrollY > 50 : false);

  // Hook para obtener la ruta actual
  const location = useLocation();

  // Comprueba si estamos actualmente en la página principal
  const isHomePage = location.pathname === '/';

  // Efecto que detecta el scroll SÓLO para cambiar el color de fondo (de transparente a blanco)
  // El TAMAÑO de la cabecera ya es 100% estático gracias al CSS.
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para abrir o cerrar el menú en versión móvil
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // La cabecera es de tamaño estático. Solo cambia su color de fondo a blanco (clase 'scrolled')
  // si el usuario baja o si NO estamos en la página de inicio.
  const headerClass = `site-header ${isHomePage ? (scrolled ? 'scrolled' : '') : 'scrolled solid-always'}`;

  return (
    <header className={headerClass}>
      <div className="header-container">

        {/* LOGO DE LA EMPRESA */}
        <div className="logo-container">
          <Link to="/">
            <img
              src={logoImg}
              alt="Matsso Logo"
              className="logo-img"
            />
          </Link>
        </div>

        {/* MENÚ DE NAVEGACIÓN PRINCIPAL */}
        <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            {/* Rutas (Links) hacia las diferentes páginas. onClick cierra el menú en móviles. */}
            <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Inicio</Link></li>
            <li><Link to="/capacitaciones" onClick={() => setIsMenuOpen(false)}>Capacitaciones</Link></li>
            <li><Link to="/certificaciones" onClick={() => setIsMenuOpen(false)}>Certificaciones</Link></li>
            <li><Link to="/contacto" onClick={() => setIsMenuOpen(false)}>Contacto</Link></li>
          </ul>
        </nav>

        {/* BOTONES DE LA DERECHA (Login, Carrito, Menú Hamburguesa) */}
        <div className="header-actions">

          {/* Botón de Inicio de Sesión */}
          <Link to="/login" className="login-btn">
            <i className="fa-regular fa-user"></i> Iniciar Sesión
          </Link>

          {/* Botón del Carrito de Compras */}
          <Link to="/carrito" className="cart-btn">
            <div className="cart-icon-wrapper">
              <i className="fa-solid fa-cart-shopping"></i>
              {/* Círculo amarillo con el número de items en el carrito */}
              <span className="cart-count">{getCartCount()}</span>
            </div>
          </Link>

          {/* Botón de Menú para Celulares (Ícono de hamburguesa o X) */}
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;
