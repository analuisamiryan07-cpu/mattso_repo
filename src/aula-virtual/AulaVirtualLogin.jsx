// Paso 1 del portón del Aula Virtual. Reutiliza el login real del sitio
// (mismas clases de Login.css, mismo authService) — no es un login nuevo,
// es el mismo con el que ya se compra en la tienda. Solo se muestra el
// formulario de "Iniciar Sesión"; "Crear cuenta" saca de esta app y lleva
// a la página web real para registrarse ahí.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@api/authService';
import '@pages/Login.css';
const logoImg = 'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png';

const AulaVirtualLogin = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = 'Ingresa tu correo';
    if (!form.password) errs.password = 'Ingresa tu contraseña';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.login(form.email, form.password);
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas. Verifica e intenta de nuevo.';
      setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

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
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem' }}>
          ¿Todavía no tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => navigate('/login', { state: { tab: 'register' } })}
            style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Crear cuenta
          </button>
        </p>
      </div>
    </div>
  );
};

export default AulaVirtualLogin;
