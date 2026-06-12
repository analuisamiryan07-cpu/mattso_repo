import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { cursosService } from '@api/cursosService';
import { authService } from '@api/authService';
import './Carrito.css';

const Carrito = () => {
  const { cartItems, removeFromCart, updateQty, clearCart, getCartTotal } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isLoggedIn = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  const [form, setForm] = useState({
    nombre:  currentUser?.nombre  || '',
    cedula:  currentUser?.cedula  || '',
    email:   currentUser?.correo  || '',
    celular: currentUser?.telefono || '',
  });
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const TASA_IVA = 0.15;
  const subtotal = getCartTotal();
  const iva = subtotal * TASA_IVA;
  const total = subtotal + iva;
  const fmt = (n) => `$${n.toFixed(2)}`;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, comprobante: 'El archivo excede el tamaño máximo de 5MB.' }));
        setComprobanteFile(null);
        return;
      }
      setComprobanteFile(file);
      setFormErrors(prev => ({ ...prev, comprobante: '' }));
    }
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setComprobanteFile(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim())  errs.nombre  = 'Campo requerido';
    if (!form.cedula.trim())  errs.cedula  = 'Campo requerido';
    if (!form.email.trim())   errs.email   = 'Campo requerido';
    if (!form.celular.trim()) errs.celular = 'Campo requerido';
    if (!comprobanteFile)     errs.comprobante = 'Debes subir tu comprobante de pago para procesar la orden.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      addToast('No tienes cursos en el carrito.', 'warning');
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        cliente: {
          nombre: form.nombre,
          cedula: form.cedula,
          email: form.email,
          celular: form.celular,
        },
        items: cartItems.map(item => ({
          id: Number(item.id),
          cantidad: item.cantidad,
          precio: Number(item.precio),
        })),
      };
      await cursosService.crearOrden(orderData, comprobanteFile);
      addToast(`¡Gracias ${form.nombre}! Tu pedido ha sido registrado y está en verificación.`, 'success');
      clearCart();
      navigate('/');
    } catch (err) {
      console.error('Error procesando orden:', err);
      const msg = err.code === 'ECONNABORTED'
        ? 'El servidor está iniciando, por favor intenta de nuevo en unos segundos.'
        : 'Ocurrió un error al procesar tu pedido. Inténtalo de nuevo.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="carrito-page">
      <div className="container carrito-layout">

        {/* COLUMNA IZQUIERDA */}
        <div className="carrito-left">
          <div className="carrito-header">
            <Link to="/" className="back-link">
              <i className="fa-solid fa-chevron-left" />
            </Link>
            <h1>Carrito de Compras</h1>
            {cartItems.length > 0 && (
              <span className="carrito-count">
                {cartItems.reduce((a, i) => a + i.cantidad, 0)} curso{cartItems.reduce((a, i) => a + i.cantidad, 0) !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* LISTA DE ÍTEMS */}
          <div className="carrito-list">
            {cartItems.length === 0 ? (
              <div className="carrito-empty">
                <i className="fa-solid fa-basket-shopping" />
                <p>Tu carrito está vacío</p>
                <Link to="/certificaciones" className="btn-primary">Ver certificaciones</Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="carrito-item">
                  <div className="carrito-item__img">
                    <img
                      src={item.imagen}
                      alt={item.titulo}
                      onError={(e) => { e.target.src = 'https://placehold.co/120x80/002147/fff?text=Matsso'; }}
                    />
                  </div>
                  <div className="carrito-item__body">
                    <div className="carrito-item__top">
                      <h4>{item.titulo}</h4>
                      <button className="carrito-item__remove" onClick={() => removeFromCart(item.id)} title="Eliminar">
                        <i className="fa-regular fa-trash-can" />
                      </button>
                    </div>
                    {item.modalidad && <span className="carrito-item__badge">{item.modalidad}</span>}
                    <div className="carrito-item__bottom">
                      <div className="qty-controls">
                        <button onClick={() => updateQty(item.id, -1)}><i className="fa-solid fa-minus" /></button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => updateQty(item.id, 1)}><i className="fa-solid fa-plus" /></button>
                      </div>
                      <div className="carrito-item__prices">
                        <span className="price-unit">{fmt(item.precio)} / ud.</span>
                        <strong className="price-total">{fmt(item.precio * item.cantidad)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SECCIÓN DE CHECKOUT */}
          {cartItems.length > 0 && (
            !isLoggedIn ? (
              /* ── Bloqueo de login ── */
              <div className="login-required-box">
                <i className="fa-solid fa-lock" />
                <h3>Inicia sesión para continuar</h3>
                <p>Necesitas una cuenta para completar tu compra. Es rápido y gratuito.</p>
                <div className="login-required-actions">
                  <Link
                    to="/login"
                    state={{ from: '/carrito' }}
                    className="btn-primary"
                  >
                    <i className="fa-regular fa-user" /> Iniciar Sesión
                  </Link>
                  <Link
                    to="/login"
                    state={{ from: '/carrito', tab: 'register' }}
                    className="btn-secondary"
                  >
                    Crear Cuenta
                  </Link>
                </div>
              </div>
            ) : (
              /* ── Formulario de checkout ── */
              <form className="facturacion-form" onSubmit={handleSubmit} noValidate>
                <div className="form-section">
                  <h3>Datos de Facturación</h3>
                  {currentUser && (
                    <p className="logged-as-note">
                      <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', marginRight: 6 }} />
                      Comprando como <strong>{currentUser.nombre}</strong> — <span style={{ color: '#6b7280' }}>{currentUser.correo}</span>
                    </p>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombres Completos</label>
                      <input
                        type="text" name="nombre" value={form.nombre}
                        onChange={handleChange} placeholder="Ej: Juan Pérez"
                      />
                      {formErrors.nombre && <span className="form-error">{formErrors.nombre}</span>}
                    </div>
                    <div className="form-group">
                      <label>Cédula o RUC</label>
                      <input
                        type="text" name="cedula" value={form.cedula}
                        onChange={handleChange} placeholder="Ej: 1712345678"
                      />
                      {formErrors.cedula && <span className="form-error">{formErrors.cedula}</span>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Correo Electrónico</label>
                      <input
                        type="email" name="email" value={form.email}
                        onChange={handleChange} placeholder="Ej: juan@email.com"
                      />
                      {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label>Celular</label>
                      <input
                        type="tel" name="celular" value={form.celular}
                        onChange={handleChange} placeholder="Ej: 0991234567"
                      />
                      {formErrors.celular && <span className="form-error">{formErrors.celular}</span>}
                    </div>
                  </div>
                </div>

                <div className="form-section payment-method-section">
                  <h3>Método de Pago</h3>
                  <div className="payment-options">
                    <div className="payment-option active">
                      <div className="payment-option__radio">
                        <input type="radio" checked readOnly />
                        <label>Deuna / Transferencia Bancaria Directa</label>
                      </div>
                      <span className="payment-option__badge">Recomendado</span>
                    </div>
                  </div>

                  <div className="payment-instructions">
                    <div className="payment-instructions__grid">
                      <div className="payment-qr-container">
                        <img src="/qr_deuna.png" alt="Deuna QR Code" className="payment-qr-image" />
                        <span className="payment-qr-caption">Escanea con Deuna o Pichincha Banca Móvil</span>
                      </div>
                      <div className="payment-details-container">
                        <h4>Detalles de la cuenta:</h4>
                        <ul className="bank-details-list">
                          <li><strong>Banco:</strong> Banco Pichincha</li>
                          <li><strong>Tipo de Cuenta:</strong> Ahorros</li>
                          <li><strong>Número de Cuenta:</strong> 2201234567</li>
                          <li><strong>Titular:</strong> MATSSO ECUADOR S.A.S.</li>
                          <li><strong>RUC:</strong> 1793084729001</li>
                          <li><strong>Correo:</strong> pagos@campusmatsso.com</li>
                        </ul>
                        <div className="payment-alert">
                          <i className="fa-solid fa-circle-info" />
                          <span>Transfiere el valor exacto de <strong>{fmt(total)}</strong> y sube una foto o captura del comprobante a continuación.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="comprobante-upload-group form-group">
                    <label>Comprobante de Pago (Captura o PDF)</label>
                    <div className={`file-upload-wrapper ${comprobanteFile ? 'has-file' : ''}`}>
                      <input
                        type="file"
                        id="comprobante-input"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="comprobante-input" className="file-upload-trigger">
                        {comprobanteFile ? (
                          <div className="file-upload-trigger-content">
                            <i className="fa-solid fa-file-circle-check" />
                            <div className="file-info">
                              <span className="file-name">{comprobanteFile.name}</span>
                              <span className="file-size">{(comprobanteFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                            <button type="button" className="btn-remove-file" onClick={handleRemoveFile} title="Eliminar comprobante">
                              <i className="fa-solid fa-xmark" />
                            </button>
                          </div>
                        ) : (
                          <div className="file-upload-trigger-content">
                            <i className="fa-solid fa-cloud-arrow-up" />
                            <span>Seleccionar comprobante (PNG, JPG, PDF - Máx. 5MB)</span>
                          </div>
                        )}
                      </label>
                    </div>
                    {formErrors.comprobante && <span className="form-error">{formErrors.comprobante}</span>}
                  </div>
                </div>

                <button type="submit" id="submit-carrito" style={{ display: 'none' }} />
              </form>
            )
          )}
        </div>

        {/* COLUMNA DERECHA — RESUMEN */}
        <div className="carrito-right">
          <div className="resumen-box">
            <h3>Resumen de Pago</h3>
            <div className="resumen-total">
              <strong>{fmt(total)}</strong>
            </div>
            <div className="resumen-desglose">
              <span>Subtotal <b>{fmt(subtotal)}</b></span>
              <span>IVA 15% <b>{fmt(iva)}</b></span>
            </div>
            {isLoggedIn ? (
              <button
                className="btn-primary btn-checkout"
                disabled={cartItems.length === 0 || loading}
                onClick={() => document.getElementById('submit-carrito').click()}
              >
                {loading ? 'Procesando...' : (<>Continuar <i className="fa-solid fa-arrow-right" /></>)}
              </button>
            ) : (
              <Link to="/login" state={{ from: '/carrito' }} className="btn-primary btn-checkout" style={{ textAlign: 'center' }}>
                <i className="fa-regular fa-user" /> Iniciar Sesión
              </Link>
            )}
            <Link to="/certificaciones" className="btn-secondary btn-mas-cursos">
              <i className="fa-solid fa-magnifying-glass" /> Ver más certificaciones
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Carrito;
