import React, { useEffect, useState } from 'react';
import './Toast.css';

const ICONS = {
  success: 'fa-solid fa-circle-check',
  error: 'fa-solid fa-circle-xmark',
  warning: 'fa-solid fa-triangle-exclamation',
  info: 'fa-solid fa-circle-info',
};

const Toast = ({ toast, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeño delay para activar la animación de entrada
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // espera la animación de salida
  };

  return (
    <div className={`toast toast--${toast.type} ${visible ? 'toast--visible' : ''}`}>
      <i className={ICONS[toast.type] || ICONS.info} />
      <span className="toast__message">{toast.message}</span>
      <button className="toast__close" onClick={handleClose} aria-label="Cerrar">
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
};

export default Toast;
