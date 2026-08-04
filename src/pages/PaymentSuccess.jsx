import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccess = () => (
  <div style={{ textAlign: 'center', padding: '100px 20px' }}>
    <i className="fa-solid fa-circle-check" style={{ fontSize: '4rem', color: '#16a34a', marginBottom: 20 }} />
    <h2 style={{ fontSize: '2rem', color: 'var(--primary-blue, #002147)', marginBottom: 12 }}>
      ¡Pago completado con éxito!
    </h2>
    <p style={{ color: '#6b7280', maxWidth: 480, margin: '0 auto 32px' }}>
      Tu pago fue procesado correctamente. Recibirás un correo de confirmación con los detalles de tu compra.
    </p>
    <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <i className="fa-solid fa-house" /> Volver al inicio
    </Link>
  </div>
);

export default PaymentSuccess;
