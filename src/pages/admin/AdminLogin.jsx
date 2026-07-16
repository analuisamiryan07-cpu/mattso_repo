import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { adminService } from '../../api/adminService';

export default function AdminLogin() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      await adminService.getAllOrders(key.trim());
      login(key.trim());
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Clave incorrecta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoText}>MATSSO</span>
          <span style={s.logoSub}>Panel Administrativo</span>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Clave de acceso</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Ingresa la clave de administrador"
            style={s.input}
            autoFocus
            disabled={loading}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <p style={s.footer}>
          <a href="/" style={s.link}>← Volver al sitio</a>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0D1117',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  card: {
    background: '#161B27',
    border: '1px solid #252D42',
    borderRadius: '14px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoText: {
    display: 'block',
    fontSize: '26px',
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: '0.06em',
  },
  logoSub: {
    display: 'block',
    fontSize: '12px',
    color: '#6B748F',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#9BA6C4',
    letterSpacing: '0.04em',
  },
  input: {
    background: '#0D1117',
    border: '1px solid #252D42',
    borderRadius: '8px',
    color: '#DDE3F4',
    fontSize: '14px',
    padding: '11px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    fontSize: '13px',
    color: '#F87171',
    margin: '0',
    padding: '10px 12px',
    background: 'rgba(248,113,113,0.08)',
    borderRadius: '6px',
    border: '1px solid rgba(248,113,113,0.25)',
  },
  btn: {
    background: '#0A2463',
    color: '#FFD700',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.2s',
  },
  footer: { textAlign: 'center', marginTop: '20px', marginBottom: '0' },
  link: { fontSize: '13px', color: '#6B748F', textDecoration: 'none' },
};
