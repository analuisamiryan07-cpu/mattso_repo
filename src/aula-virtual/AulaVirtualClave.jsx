// Paso 2 del portón: la clave que genera el sistema interno y manda por
// correo (Moodles/lms/docs/REQUISITOS_SISTEMA_INTERNO.md §4). Este paso solo
// se muestra una vez en la vida de la cuenta — después de validarla la
// primera vez, /lms/access-codes/status ya no vuelve a pedirla.

import { useState } from 'react';
import { lmsService } from '@api/lmsService';
import './AulaVirtualGate.css';

const AulaVirtualClave = ({ onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Ingresa tu clave.'); return; }
    setLoading(true);
    setError('');
    try {
      await lmsService.verificarClave(code.trim());
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Clave incorrecta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="av-clave-icon"><i className="fa-solid fa-key" /></div>
          <p className="login-subtitle">Ingresa la clave que te enviamos por correo para entrar al Aula Virtual.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="lf-group">
            <label>Clave de acceso</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={12}
              autoComplete="one-time-code"
              className="av-clave-input"
            />
            {error && <span className="lf-error">{error}</span>}
          </div>
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar al Aula Virtual'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          ¿No la recibiste? Revisa tu correo o contacta a soporte.
        </p>
      </div>
    </div>
  );
};

export default AulaVirtualClave;
