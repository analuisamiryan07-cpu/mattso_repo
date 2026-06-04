import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    // 'site-footer-v2' es la clase principal que controla todo el pie de página
    <footer className="site-footer-v2">
      
      {/* SECCIÓN BLANCA (Parte Superior) */}
      <div className="footer-v2-top">
        <div className="footer-v2-container">
          
          {/* COLUMNA 1: LOGO Y TEXTO */}
          <div className="footer-v2-logo-section">
            {/* Aquí cambias la ruta de la imagen del logo del pie de página */}
            <img 
              src="https://campusmatsso.com/wp-content/uploads/2024/07/LOGO-MATSSO-02-1.png" 
              alt="Matsso Logo" 
              className="footer-v2-logo"
            />
            {/* Texto que va justo debajo del logo */}
            <p className="footer-v2-tagline">CERTIFICACIÓN Y CAPACITACIÓN PROFESIONAL</p>
          </div>

          {/* COLUMNA 2: INFORMACIÓN DE CONTACTO */}
          {/* Aquí puedes modificar las palabras "Dirección", el número telefónico, o el correo */}
          <div className="footer-v2-info-section">
            <p><i className="fa-solid fa-location-dot"></i> Dirección: Quito, Ecuador</p>
            <p><i className="fa-regular fa-envelope"></i> Correo: info@matssoecuador.com</p>
            <p><i className="fa-brands fa-whatsapp"></i> WhatsApp o Celular: +593 98 355 5081</p>
          </div>

          {/* COLUMNA 3: REDES SOCIALES */}
          <div className="footer-v2-social-section">
            <h3>Contáctanos</h3>
            <div className="social-icons-row">
              {/* En 'href="#"' debes colocar el link real a tu red social (ej: href="https://facebook.com/matsso") */}
              <a href="#" className="social-icon"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="social-icon"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="social-icon"><i className="fa-brands fa-youtube"></i></a>
              <a href="#" className="social-icon"><i className="fa-brands fa-whatsapp"></i></a>
              <a href="#" className="social-icon"><i className="fa-solid fa-globe"></i></a>
              <a href="#" className="social-icon"><i className="fa-regular fa-envelope"></i></a>
            </div>
          </div>

        </div>
      </div>
      
      {/* SECCIÓN AZUL (Parte Inferior - Derechos de Autor) */}
      <div className="footer-v2-bottom">
        <p>Copyright @2024 Todos los Derechos reservados - MATSSO ECUADOR</p>
      </div>
    </footer>
  );
};

export default Footer;
