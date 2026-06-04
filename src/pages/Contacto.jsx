import React, { useState } from 'react';
import { useToast } from '@context/ToastContext';
import { cursosService } from '@api/cursosService';
import './Contacto.css';

const Contacto = () => {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', asunto: 'Información general', mensaje: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim())   errs.nombre  = 'Campo requerido';
    if (!form.email.trim())    errs.email   = 'Campo requerido';
    if (!form.mensaje.trim())  errs.mensaje = 'Campo requerido';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await cursosService.enviarContacto(form);
      addToast('¡Mensaje enviado! Te contactaremos pronto.', 'success');
      setForm({ nombre: '', email: '', telefono: '', asunto: 'Información general', mensaje: '' });
    } catch {
      addToast('Error al enviar el mensaje. Inténtalo de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contacto-page">

      {/* HERO */}
      <section className="contacto-hero">
        <div className="contacto-hero-overlay" />
        <div className="contacto-hero-content">
          <h1>Contáctanos</h1>
          <p>Estamos aquí para responder todas tus preguntas sobre nuestros programas.</p>
        </div>
      </section>

      <div className="container contacto-body">

        {/* INFO */}
        <div className="contacto-info">
          <h2>Información de Contacto</h2>

          <div className="info-item">
            <div className="info-icon"><i className="fa-solid fa-location-dot" /></div>
            <div>
              <h4>Dirección</h4>
              <p>Quito, Ecuador</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon"><i className="fa-brands fa-whatsapp" /></div>
            <div>
              <h4>WhatsApp</h4>
              <a href="https://wa.me/593983555081" target="_blank" rel="noopener noreferrer">
                +593 98 355 5081
              </a>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon"><i className="fa-regular fa-envelope" /></div>
            <div>
              <h4>Correo</h4>
              <a href="mailto:info@matssoecuador.com">info@matssoecuador.com</a>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon"><i className="fa-regular fa-clock" /></div>
            <div>
              <h4>Horario de atención</h4>
              <p>Lun – Vie: 8:00 – 18:00</p>
              <p>Sáb: 9:00 – 13:00</p>
            </div>
          </div>

          <div className="contacto-social">
            <a href="#" className="social-btn"><i className="fa-brands fa-facebook-f" /></a>
            <a href="#" className="social-btn"><i className="fa-brands fa-instagram" /></a>
            <a href="#" className="social-btn"><i className="fa-brands fa-youtube" /></a>
            <a href="https://wa.me/593983555081" target="_blank" rel="noopener noreferrer" className="social-btn social-btn--whatsapp">
              <i className="fa-brands fa-whatsapp" />
            </a>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="contacto-form-wrap">
          <h2>Envíanos un Mensaje</h2>
          <form className="contacto-form" onSubmit={handleSubmit} noValidate>
            <div className="cf-row">
              <div className="cf-group">
                <label>Nombre completo *</label>
                <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan Pérez" />
                {errors.nombre && <span className="cf-error">{errors.nombre}</span>}
              </div>
              <div className="cf-group">
                <label>Correo Electrónico *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="juan@ejemplo.com" />
                {errors.email && <span className="cf-error">{errors.email}</span>}
              </div>
            </div>
            <div className="cf-row">
              <div className="cf-group">
                <label>Teléfono / WhatsApp</label>
                <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} placeholder="0991234567" />
              </div>
              <div className="cf-group">
                <label>Asunto</label>
                <select name="asunto" value={form.asunto} onChange={handleChange}>
                  <option>Información general</option>
                  <option>Inscripción a curso</option>
                  <option>Proceso de certificación</option>
                  <option>Capacitación empresarial</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>
            <div className="cf-group">
              <label>Mensaje *</label>
              <textarea name="mensaje" value={form.mensaje} onChange={handleChange} rows={5} placeholder="Escribe tu mensaje aquí..." />
              {errors.mensaje && <span className="cf-error">{errors.mensaje}</span>}
            </div>
            <button type="submit" className="cf-submit" disabled={loading}>
              {loading ? 'Enviando...' : (<><i className="fa-solid fa-paper-plane" /> Enviar Mensaje</>)}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contacto;
