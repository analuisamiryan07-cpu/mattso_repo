import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@api/authService';
import './Login.css';

const logoImg = 'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png';

const ForgotPassword = () => {
  const [correo, setCorreo]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correo.trim()) return;
    setLoading(true);
    try {
      await authService.forgotPassword(correo.trim());
    } catch {
      // Siempre mostrar éxito — no revelar si el email existe
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <img src={logoImg} alt="Sapper Industries" className="login-logo" />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-blue)', margin: '0 0 4px' }}>
            Recuperar contraseña
          </h2>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: 8, padding: '16px', marginBottom: 20,
            }}>
              <p style={{ color: '#166534', margin: 0, fontSize: '0.9rem' }}>
                Si el correo está registrado, recibirás el enlace en los próximos minutos. Revisa también tu carpeta de spam.
              </p>
            </div>
            <Link to="/login" className="btn-login" style={{ display: 'block', textAlign: 'center' }}>
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 20, marginTop: 4 }}>
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña. El enlace expira en 1 hora.
            </p>
            <div className="form-group-login">
              <label className="form-label-login">Correo electrónico</label>
              <input
                className="form-input-login"
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem' }}>
              <Link to="/login" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
                ← Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
