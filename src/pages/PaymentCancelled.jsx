import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancelled = () => (
  <div style={{ textAlign: 'center', padding: '100px 20px' }}>
    <i className="fa-solid fa-circle-xmark" style={{ fontSize: '4rem', color: '#dc2626', marginBottom: 20 }} />
    <h2 style={{ fontSize: '2rem', color: 'var(--primary-blue, #002147)', marginBottom: 12 }}>
      Pago cancelado
    </h2>
    <p style={{ color: '#6b7280', maxWidth: 480, margin: '0 auto 32px' }}>
      Cancelaste el proceso de pago. Tu carrito sigue intacto — puedes intentarlo de nuevo cuando quieras.
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link to="/carrito" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <i className="fa-solid fa-cart-shopping" /> Volver al carrito
      </Link>
      <Link to="/" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <i className="fa-solid fa-house" /> Ir al inicio
      </Link>
    </div>
  </div>
);

export default PaymentCancelled;
