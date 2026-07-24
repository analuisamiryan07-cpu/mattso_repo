import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { authService } from '@api/authService';
import './Header.css';

const logoImg = '/logo_matsso_qhse_raw.png';

const SOCIAL_LINKS = [
  { icon: 'fa-brands fa-facebook-f',  href: 'https://www.facebook.com/matssoecu',                          label: 'Facebook'  },
  { icon: 'fa-brands fa-instagram',   href: 'https://www.instagram.com/matssoecu',                         label: 'Instagram' },
  { icon: 'fa-brands fa-linkedin-in', href: 'https://www.linkedin.com/company/matssoecuador/',             label: 'LinkedIn'  },
  { icon: 'fa-brands fa-youtube',     href: 'https://www.youtube.com/channel/UCwJ_dXr4d5tKQ_A5_CjvWfw',   label: 'YouTube'   },
  { icon: 'fa-brands fa-tiktok',      href: 'https://www.tiktok.com/@matssoecuador',                       label: 'TikTok'    },
  { icon: 'fa-brands fa-x-twitter',   href: 'https://x.com/matssoecu',                                    label: 'X'         },
  { icon: 'fa-brands fa-whatsapp',    href: 'https://wa.me/593983555081',                                  label: 'WhatsApp'  },
  { icon: 'fa-regular fa-envelope',   href: 'mailto:matssoecuador@gmail.com',                              label: 'Email'     },
];

const Header = () => {
  const { getCartCount } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen]     = useState(false);
  const [programasOpen, setProgramasOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen]  = useState(false);
  const [scrolled, setScrolled]          = useState(typeof window !== 'undefined' ? window.scrollY > 50 : false);
  const [isLoggedIn, setIsLoggedIn]      = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser]    = useState(authService.getCurrentUser());

  const programasRef = useRef(null);
  const userMenuRef  = useRef(null);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated());
    setCurrentUser(authService.getCurrentUser());
    setIsMenuOpen(false);
    setProgramasOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (programasRef.current && !programasRef.current.contains(e.target)) setProgramasOpen(false);
      if (userMenuRef.current  && !userMenuRef.current.contains(e.target))  setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserMenuOpen(false);
    setIsMenuOpen(false);
    addToast('Sesión cerrada correctamente', 'success');
    navigate('/');
  };

  const closeAll = () => {
    setIsMenuOpen(false);
    setProgramasOpen(false);
    setUserMenuOpen(false);
  };

  const headerClass = `site-header ${isHomePage ? (scrolled ? 'scrolled' : '') : 'scrolled solid-always'}`;
  const firstName = currentUser?.nombre?.split(' ')[0] || 'Usuario';

  return (
    <header className={headerClass}>
      <div className="header-container">

        <div className="logo-container">
          <Link to="/" onClick={closeAll}>
            <img src={logoImg} alt="Matsso Logo" className="logo-img" />
          </Link>
        </div>

        <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-list">

            {/* Mobile-only: user greeting or login */}
            {isLoggedIn && currentUser ? (
              <li className="nav-auth-mobile">
                <div className="nav-user-mobile">
                  <i className="fa-regular fa-user" />
                  <span>{currentUser.nombre}</span>
                </div>
                <button className="nav-logout-mobile" onClick={handleLogout}>
                  <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
                </button>
              </li>
            ) : (
              <li className="nav-login-mobile">
                <Link to="/login" onClick={closeAll}>
                  <i className="fa-regular fa-user" /> Iniciar Sesión
                </Link>
              </li>
            )}

            <li><Link to="/" onClick={closeAll}>Inicio</Link></li>
            <li><Link to="/nosotros" onClick={closeAll}>Nosotros</Link></li>

            {/* Programas dropdown */}
            <li className="nav-item-dropdown" ref={programasRef}>
              <button
                className="nav-dropdown-toggle"
                onClick={() => setProgramasOpen(o => !o)}
                aria-expanded={programasOpen}
              >
                Programas&nbsp;<i className={`fa-solid fa-chevron-down nav-chevron ${programasOpen ? 'rotated' : ''}`} />
              </button>
              <ul className={`nav-dropdown-menu ${programasOpen ? 'open' : ''}`}>
                <li>
                  <Link to="/capacitaciones" onClick={closeAll}>
                    <i className="fa-solid fa-chalkboard-user" /> Capacitaciones
                  </Link>
                </li>
                <li>
                  <Link to="/certificaciones" onClick={closeAll}>
                    <i className="fa-solid fa-certificate" /> Certificaciones
                  </Link>
                </li>
              </ul>
            </li>

            <li><Link to="/contacto" onClick={closeAll}>Contáctanos</Link></li>

            {/* Social icons – only visible inside mobile menu */}
            <li className="nav-social-mobile">
              <div className="nav-social-row">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="nav-social-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className={s.icon} />
                  </a>
                ))}
              </div>
            </li>

          </ul>
        </nav>

        <div className="header-actions">

          {/* Social icons – desktop only */}
          <div className="header-socials">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                aria-label={s.label}
                className="header-social-icon"
              >
                <i className={s.icon} />
              </a>
            ))}
          </div>

          {/* User dropdown (desktop) */}
          {isLoggedIn && currentUser ? (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button className="user-menu-btn" onClick={() => setUserMenuOpen(o => !o)}>
                <i className="fa-regular fa-user" />
                <span className="user-first-name">{firstName}</span>
                <i className={`fa-solid fa-chevron-down user-chevron ${userMenuOpen ? 'rotated' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-info">
                    <strong>{currentUser.nombre}</strong>
                    <small>{currentUser.correo}</small>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-logout" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              <i className="fa-regular fa-user" /> Iniciar Sesión
            </Link>
          )}

          <Link to="/carrito" className="cart-btn">
            <div className="cart-icon-wrapper">
              <i className="fa-solid fa-cart-shopping" />
              <span className="cart-count">{getCartCount()}</span>
            </div>
          </Link>

          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(o => !o)}>
            <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;
