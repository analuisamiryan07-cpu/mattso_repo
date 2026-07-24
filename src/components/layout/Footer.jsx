import React from 'react';
import './Footer.css';

const SOCIAL_LINKS = [
  { icon: 'fa-brands fa-facebook-f',  href: 'https://www.facebook.com/matssoecu',                        label: 'Facebook'  },
  { icon: 'fa-brands fa-instagram',   href: 'https://www.instagram.com/matssoecu',                       label: 'Instagram' },
  { icon: 'fa-brands fa-linkedin-in', href: 'https://www.linkedin.com/company/matssoecuador/',           label: 'LinkedIn'  },
  { icon: 'fa-brands fa-youtube',     href: 'https://www.youtube.com/channel/UCwJ_dXr4d5tKQ_A5_CjvWfw', label: 'YouTube'   },
  { icon: 'fa-brands fa-tiktok',      href: 'https://www.tiktok.com/@matssoecuador',                     label: 'TikTok'    },
  { icon: 'fa-brands fa-whatsapp',    href: 'https://wa.me/593983555081',                                label: 'WhatsApp'  },
  { icon: 'fa-regular fa-envelope',   href: 'mailto:matssoecuador@gmail.com',                            label: 'Email'     },
];

const Footer = () => {
  return (
    <footer className="site-footer-v2">

      {/* SECCIÓN BLANCA (Parte Superior) */}
      <div className="footer-v2-top">
        <div className="footer-v2-container">

          {/* COLUMNA 1: LOGO Y TEXTO */}
          <div className="footer-v2-logo-section">
            <img
              src="https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png"
              alt="Matsso Logo"
              className="footer-v2-logo"
            />
            <p className="footer-v2-tagline">CERTIFICACIÓN Y CAPACITACIÓN PROFESIONAL</p>
          </div>

          {/* COLUMNA 2: INFORMACIÓN DE CONTACTO */}
          <div className="footer-v2-info-section">
            <p><i className="fa-solid fa-location-dot" /> Dirección: Quito, Ecuador</p>
            <p>
              <i className="fa-regular fa-envelope" />
              <a href="mailto:matssoecuador@gmail.com" className="footer-link">
                matssoecuador@gmail.com
              </a>
            </p>
            <p>
              <i className="fa-brands fa-whatsapp" />
              <a href="https://wa.me/593983555081" target="_blank" rel="noopener noreferrer" className="footer-link">
                +593 98 355 5081
              </a>
            </p>
          </div>

          {/* COLUMNA 3: REDES SOCIALES */}
          <div className="footer-v2-social-section">
            <h3>Síguenos</h3>
            <div className="social-icons-row">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label={s.label}
                  title={s.label}
                >
                  <i className={s.icon} />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* SECCIÓN AZUL (Parte Inferior - Derechos de Autor) */}
      <div className="footer-v2-bottom">
        <p>© 2026 MATSSO Ecuador. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
