// Pantalla dedicada para canjear la primera clave — se muestra en "/" solo
// cuando el estudiante todavía no tiene ningún curso vigente (recién creó
// cuenta o se le venció/revocó todo). Con header y footer completos, a
// diferencia del formulario embebido que ya existía en MisCursos.jsx.

import { useState } from 'react';
import { lmsService } from '@api/lmsService';
import AulaHeader from '@layout/AulaHeader';
import AulaFooter from '@layout/AulaFooter';
import './IngresarClave.css';

const IngresarClave = ({ onCanjeada }) => {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clave.trim()) { setError('Escribe el código que te enviamos por correo.'); return; }
    setLoading(true);
    setError('');
    setOk('');
    try {
      const res = await lmsService.canjearClave(clave.trim());
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
      <AulaHeader variant="panel" />

      <main className="ic-main">
        <div className="ic-card">
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
