import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@api/authService';
import { useToast } from '@context/ToastContext';
import './Login.css';

const logoImg = 'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png';
const PASSWORD_RE = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const ResetPassword = () => {
  const { addToast }          = useToast();
  const navigate              = useNavigate();
  const [searchParams]        = useSearchParams();
  const token                 = searchParams.get('token') || '';

  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.password.length < 8)               errs.password = 'Mínimo 8 caracteres.';
    else if (!PASSWORD_RE.test(form.password))  errs.password = 'Debe tener mayúscula, minúscula y número.';
    if (form.password !== form.confirm)         errs.confirm  = 'Las contraseñas no coinciden.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.resetPassword(token, form.password);
      addToast('¡Contraseña actualizada! Ya puedes iniciar sesión.', 'success');
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'El enlace es inválido o ha expirado.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: 16 }}>Enlace inválido o incompleto.</p>
          <Link to="/forgot-password" className="btn-login" style={{ display: 'inline-block' }}>
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <img src={logoImg} alt="Matsso" className="login-logo" />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-blue)', margin: '0 0 4px' }}>
            Nueva contraseña
          </h2>
          <p className="login-subtitle">Elige una contraseña segura para tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group-login">
            <label className="form-label-login">Nueva contraseña</label>
            <input
              className="form-input-login"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mín. 8 caracteres, mayúscula y número"
              autoFocus
            />
            {errors.password && <span className="form-error-login">{errors.password}</span>}
          </div>

          <div className="form-group-login">
            <label className="form-label-login">Confirmar contraseña</label>
            <input
              className="form-input-login"
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repite tu nueva contraseña"
            />
            {errors.confirm && <span className="form-error-login">{errors.confirm}</span>}
          </div>

          <button type="submit" className="btn-login" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
