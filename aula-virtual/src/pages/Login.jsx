// Paso 1 del portón. Reutiliza el mismo look del login del sitio público
// (mismas clases visuales) pero es su propio componente — proyecto aparte,
// no importa el Login.jsx del otro repo. Valida credenciales Y que la
// cuenta tenga una orden pagada (authService.gateLogin -> POST /lms/gate/login).
// Si la cuenta existe pero no hay orden pagada, no se deja avanzar más: se
// bloquea con un mensaje, sin reintentos sobre el mismo formulario.

import { useState } from 'react';
import { authService } from '@api/authService';
import './Login.css';

const logoImg = 'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png';
const SITIO_PUBLICO_URL = import.meta.env.VITE_SITIO_PUBLICO_URL || 'https://sapper-industries.com';

const Login = ({ onSuccess }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = 'Ingresa tu correo';
    if (!form.password) errs.password = 'Ingresa tu contraseña';
    if (!acceptTerms) errs.terms = 'Debes aceptar los Términos y Condiciones para continuar';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.gateLogin(form.email, form.password);
      onSuccess();
    } catch (err) {
      if (err.response?.data?.message === 'SIN_INSCRIPCION') {
        setBloqueado(true);
      } else {
        const msg = err.response?.data?.message || 'Credenciales incorrectas. Verifica e intenta de nuevo.';
        setErrors({ password: Array.isArray(msg) ? msg[0] : msg });
      }
    } finally {
      setLoading(false);
    }
  };

  if (bloqueado) {
    return (
      <div className="login-page">
        <div className="av-modal-backdrop">
          <div className="av-modal">
            <div className="av-modal-icon"><i className="fa-solid fa-lock" /></div>
            <h2>Necesitas inscribirte en un curso</h2>
            <p>Para acceder al Aula Virtual primero debes inscribirte y completar el pago de un curso o certificación.</p>
            <a href={SITIO_PUBLICO_URL} className="av-modal-btn">Ver catálogo y volver al sitio</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <img src={logoImg} alt="Sapper Industries Logo" className="login-logo" />
          <p className="login-subtitle">Aula Virtual — Plataforma de Capacitación Profesional</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="lf-group">
            <label>Correo Electrónico</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
            />
            {errors.email && <span className="lf-error">{errors.email}</span>}
          </div>
          <div className="lf-group">
            <label>Contraseña</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && <span className="lf-error">{errors.password}</span>}
          </div>

          <div className="lf-group lf-terms">
            <label className="lf-checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => { setAcceptTerms(e.target.checked); setErrors((p) => ({ ...p, terms: '' })); }}
              />
              <span>
                Acepto los{' '}
                <a href={`${SITIO_PUBLICO_URL}/terminos`} target="_blank" rel="noopener noreferrer" className="lf-terms-link">
                  Términos y Condiciones
                </a>
              </span>
            </label>
            {errors.terms && <span className="lf-error">{errors.terms}</span>}
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem' }}>
          ¿Todavía no tienes cuenta?{' '}
          <a href={`${SITIO_PUBLICO_URL}/login`} style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'underline' }}>
            Crear cuenta
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
