// Flujo TRADICIONAL: subir archivo, esperar calificación humana. El
// backend expone `contentItem.entrega_status` (NO_ENTREGADA / PENDIENTE_
// CALIFICACION / CALIFICADA) — no basta con el `status` genérico porque
// "entregado pero sin calificar" y "nunca entregado" se veían igual antes
// de que existiera este campo (courses.service.ts).

import { useState } from 'react';
import { lmsService } from '@api/lmsService';
import { useToast } from '@context/ToastContext';
import './EntregaTarea.css';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
const MAX_SIZE_MB = 10;

const EntregaTarea = ({ contentItem }) => {
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviadoAhora, setEnviadoAhora] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      addToast('Solo se aceptan PDF, DOCX, JPG o PNG.', 'error');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      addToast(`El archivo no puede superar ${MAX_SIZE_MB}MB.`, 'error');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) {
      addToast('Selecciona un archivo primero.', 'error');
      return;
    }
    setEnviando(true);
    try {
      await lmsService.enviarEntrega(contentItem.id, file, comentario);
      setEnviadoAhora(true);
      addToast('Entrega enviada — queda pendiente de calificación.', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'No se pudo enviar la entrega.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (contentItem.entrega_status === 'CALIFICADA' && contentItem.grade) {
    return (
      <div className="lms-entrega-calificada">
        <i className="fa-solid fa-circle-check" />
        <p className="lms-entrega-nota">{contentItem.grade.score}/100</p>
        {contentItem.grade.feedback && <p className="lms-entrega-feedback">"{contentItem.grade.feedback}"</p>}
      </div>
    );
  }

  if (enviadoAhora || contentItem.entrega_status === 'PENDIENTE_CALIFICACION') {
    return (
      <div className="lms-entrega-done">
        <i className="fa-solid fa-hourglass-half" />
        <p>Entrega enviada. Un instructor la revisará y calificará pronto.</p>
      </div>
    );
  }

  return (
    <div className="lms-entrega">
      {contentItem.assignment_instructions && (
        <p className="lms-entrega-instrucciones">{contentItem.assignment_instructions}</p>
      )}
      <label className="lms-entrega-file">
        <i className="fa-solid fa-paperclip" />
        {file ? file.name : 'Seleccionar archivo (PDF, DOCX, JPG o PNG, máx 10MB)'}
        <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} hidden />
      </label>
      <textarea
        className="lms-entrega-comentario"
        placeholder="Comentario opcional para el instructor"
        maxLength={500}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
      <button className="lms-btn-primary" onClick={handleSubmit} disabled={enviando || !file}>
        {enviando ? 'Enviando…' : 'Enviar entrega'}
      </button>
    </div>
  );
};

export default EntregaTarea;
