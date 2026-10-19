// Pie de página compartido del Aula Virtual — mismo logo y redes sociales
// que el footer del sitio público (ver src/components/layout/Footer.jsx en
// la raíz del proyecto), para no inventar enlaces nuevos.

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
      <img src={logoImg} alt="Sapper Industries" className="af-logo" />
      <div className="af-social">
        <span>Síguenos</span>
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
    <div className="af-bottom">© 2026 Sapper Industries. Todos los derechos reservados.</div>
  </footer>
);

export default AulaFooter;
