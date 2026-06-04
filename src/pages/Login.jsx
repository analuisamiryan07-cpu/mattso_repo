import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@api/authService';
import { useToast } from '@context/ToastContext';
import './Login.css';
import logoImg from '../../recursos/logo_matsso_qhse_raw.png';

const Login = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ nombre: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const handleLoginChange = (e) =>
    setLoginForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleRegisterChange = (e) =>
    setRegisterForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!loginForm.email) errs.email = 'Ingresa tu correo';
    if (!loginForm.password) errs.password = 'Ingresa tu contraseña';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.login(loginForm.email, loginForm.password);
      addToast('¡Bienvenido de vuelta!', 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas. Verifica e intenta de nuevo.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!registerForm.nombre) errs.nombre = 'Campo requerido';
    if (!registerForm.email) errs.email = 'Campo requerido';
    if (!registerForm.password || registerForm.password.length < 6)
      errs.password = 'Mínimo 6 caracteres';
    if (registerForm.password !== registerForm.confirm)
      errs.confirm = 'Las contraseñas no coinciden';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.register(registerForm.nombre, registerForm.email, registerForm.password);
      addToast('¡Cuenta creada! Bienvenido a Campus Matsso.', 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-card__header">
          <img src={logoImg} alt="Matsso Logo" className="login-logo" />
          <p className="login-subtitle">Plataforma de Capacitación Profesional</p>
        </div>

        {/* TABS */}
        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'login-tab--active' : ''}`}
            onClick={() => { setTab('login'); setErrors({}); }}
          >
            Iniciar Sesión
          </button>
          <button
            className={`login-tab ${tab === 'register' ? 'login-tab--active' : ''}`}
            onClick={() => { setTab('register'); setErrors({}); }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="lf-group">
              <label>Correo Electrónico</label>
              <input
                type="email" name="email" value={loginForm.email}
                onChange={handleLoginChange} placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
              />
              {errors.email && <span className="lf-error">{errors.email}</span>}
            </div>
            <div className="lf-group">
              <label>Contraseña</label>
              <input
                type="password" name="password" value={loginForm.password}
                onChange={handleLoginChange} placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && <span className="lf-error">{errors.password}</span>}
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form className="login-form" onSubmit={handleRegister} noValidate>
            <div className="lf-group">
              <label>Nombre completo</label>
              <input
                type="text" name="nombre" value={registerForm.nombre}
                onChange={handleRegisterChange} placeholder="Juan Pérez"
              />
              {errors.nombre && <span className="lf-error">{errors.nombre}</span>}
            </div>
            <div className="lf-group">
              <label>Correo Electrónico</label>
              <input
                type="email" name="email" value={registerForm.email}
                onChange={handleRegisterChange} placeholder="tucorreo@ejemplo.com"
              />
              {errors.email && <span className="lf-error">{errors.email}</span>}
            </div>
            <div className="lf-group">
              <label>Contraseña</label>
              <input
                type="password" name="password" value={registerForm.password}
                onChange={handleRegisterChange} placeholder="Mínimo 6 caracteres"
              />
              {errors.password && <span className="lf-error">{errors.password}</span>}
            </div>
            <div className="lf-group">
              <label>Confirmar Contraseña</label>
              <input
                type="password" name="confirm" value={registerForm.confirm}
                onChange={handleRegisterChange} placeholder="Repite tu contraseña"
              />
              {errors.confirm && <span className="lf-error">{errors.confirm}</span>}
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        <div className="login-card__footer">
          <Link to="/">← Volver al inicio</Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
