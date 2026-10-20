// Formulario para canjear una clave — lo usan PanelGeneral, AreaPersonal
// (Coursera) y las páginas de Moodle. Reutiliza lmsService.canjearClave.
import { useState } from 'react';
import { lmsService } from '@api/lmsService';
import '@pages/MisCursos.css';

const AñadirCursoForm = ({ onSuccess, onCancel, embebido }) => {
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
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo validar la clave.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`lms-añadir-form ${embebido ? 'lms-añadir-form--embebido' : ''}`} onSubmit={handleSubmit}>
      <label htmlFor="añadir-clave">Código de acceso al curso</label>
      <div className="lms-añadir-row">
        <input
          id="añadir-clave"
          type="text"
          inputMode="numeric"
          value={clave}
          onChange={(e) => setClave(e.target.value.replace(/\D/g, '').slice(0, 12))}
          placeholder="0000000000"
          maxLength={12}
          autoComplete="off"
        />
        <button type="submit" disabled={loading}>{loading ? 'Validando…' : 'Añadir curso'}</button>
        {onCancel && <button type="button" className="lms-añadir-cancelar" onClick={onCancel}>Cancelar</button>}
      </div>
      {error && <p className="lms-error" style={{ marginTop: 8 }}>{error}</p>}
      {ok && <p className="lms-ok" style={{ marginTop: 8 }}>{ok}</p>}
    </form>
  );
};

export default AñadirCursoForm;
