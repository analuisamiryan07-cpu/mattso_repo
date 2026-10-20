// Pantalla dedicada para canjear la primera clave — se muestra en "/" solo
// cuando el estudiante todavía no tiene ningún curso vigente (recién creó
// cuenta o se le venció/revocó todo). Con header y footer completos, a
// diferencia del formulario embebido que ya existía en MisCursos.jsx.
//
// Dos salidas explícitas, para que nadie se quede atorado aquí sin cursos:
// 1) Botón "Salir" / logo del header -> cierra sesión y vuelve al login.
// 2) Si no ingresa la clave en 5 minutos, se cierra la sesión sola.

import { useEffect, useRef, useState } from 'react';
import { lmsService } from '@api/lmsService';
import { authService } from '@api/authService';
import AulaHeader from '@layout/AulaHeader';
import AulaFooter from '@layout/AulaFooter';
import './IngresarClave.css';

const LIMITE_MS = 5 * 60 * 1000;

const IngresarClave = ({ onCanjeada }) => {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const yaCanjeadaRef = useRef(false);

  const salirAlLogin = () => {
    authService.logout();
    window.dispatchEvent(new Event('auth:logout'));
  };

  useEffect(() => {
    const limite = setTimeout(() => {
      if (!yaCanjeadaRef.current) salirAlLogin();
    }, LIMITE_MS);
    return () => clearTimeout(limite);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clave.trim()) { setError('Escribe el código que te enviamos por correo.'); return; }
    setLoading(true);
    setError('');
    setOk('');
    try {
      const res = await lmsService.canjearClave(clave.trim());
      yaCanjeadaRef.current = true;
      setOk(`¡Listo! "${res.curso?.titulo}" ya está en tus cursos.`);
      setClave('');
      setTimeout(() => onCanjeada?.(), 900);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo validar la clave.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ic-shell">
      <AulaHeader variant="panel" onBrandClick={salirAlLogin} />

      <main className="ic-main">
        <div className="ic-card">
          <button type="button" className="ic-salir" onClick={salirAlLogin}>
            <i className="fa-solid fa-arrow-left" /> Salir
          </button>
          <i className="fa-solid fa-key ic-icon" />
          <h1>Ingresa tu clave de acceso</h1>
          <p>Te la enviamos por correo cuando se aprobó tu compra. Escríbela aquí para activar tu curso.</p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              inputMode="numeric"
              value={clave}
              onChange={(e) => setClave(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="0000000000"
              maxLength={12}
              autoComplete="off"
            />
            <button type="submit" disabled={loading}>{loading ? 'Validando…' : 'Activar curso'}</button>
          </form>

          {error && <p className="ic-error">{error}</p>}
          {ok && <p className="ic-ok">{ok}</p>}
        </div>
      </main>

      <AulaFooter />
    </div>
  );
};

export default IngresarClave;
