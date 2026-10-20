// Pie de página compartido del Aula Virtual — copia fiel del footer del
// sitio público (src/components/layout/Footer.jsx en la raíz), con las
// mismas 3 columnas (logo, contacto, redes), para que sea el mismo en
// todas las pantallas de estudiante.

import './AulaFooter.css';

const logoImg = 'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png';

const SOCIAL_LINKS = [
  { icon: 'fa-brands fa-facebook-f', href: 'https://www.facebook.com/matssoecu', label: 'Facebook' },
  { icon: 'fa-brands fa-instagram', href: 'https://www.instagram.com/matssoecu', label: 'Instagram' },
  { icon: 'fa-brands fa-linkedin-in', href: 'https://www.linkedin.com/company/matssoecuador/', label: 'LinkedIn' },
  { icon: 'fa-brands fa-youtube', href: 'https://www.youtube.com/channel/UCwJ_dXr4d5tKQ_A5_CjvWfw', label: 'YouTube' },
  { icon: 'fa-brands fa-tiktok', href: 'https://www.tiktok.com/@matssoecuador', label: 'TikTok' },
  { icon: 'fa-brands fa-whatsapp', href: 'https://wa.me/593983555081', label: 'WhatsApp' },
  { icon: 'fa-regular fa-envelope', href: 'mailto:matssoecuador@gmail.com', label: 'Email' },
];

const AulaFooter = () => (
  <footer className="af-footer">
    <div className="af-top">
      <div className="af-container">
        <div className="af-logo-section">
          <img src={logoImg} alt="Sapper Industries Logo" className="af-logo" />
        </div>

        <div className="af-info-section">
          <p><i className="fa-solid fa-location-dot" /> Dirección: Av. 10 de Agosto N32-140 entre Mariana de Jesús y Las Guayanas.</p>
          <p>
            <i className="fa-regular fa-envelope" />
            <a href="mailto:matssoecuador@gmail.com" className="af-link">matssoecuador@gmail.com</a>
          </p>
          <p>
            <i className="fa-brands fa-whatsapp" />
            <a href="https://wa.me/593983555081" target="_blank" rel="noopener noreferrer" className="af-link">+593 98 355 5081</a>
          </p>
        </div>

        <div className="af-social-section">
          <h3>Síguenos</h3>
          <div className="af-social-icons">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
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

    <div className="af-bottom">© 2026 Sapper Industries. Todos los derechos reservados.</div>
  </footer>
);

export default AulaFooter;
