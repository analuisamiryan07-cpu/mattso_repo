import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { cursosService } from '@api/cursosService';
import { authService } from '@api/authService';
import CloudinaryImage from '@components/ui/CloudinaryImage';
import './Carrito.css';

const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CEDULA_RE = /^\d{10}(\d{3})?$/;
const PHONE_RE  = /^\d{7,15}$/;

function httpErrorMsg(err) {
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.message;
  if (status === 401) return 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 409) return 'Esta orden ya fue registrada anteriormente.';
  if (status === 413) return 'El comprobante es demasiado grande. Máximo 5 MB.';
  if (status === 422) return serverMsg || 'Datos inválidos. Revisa el formulario.';
  if (status === 429) return 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
  if (status === 400) return serverMsg || 'Datos inválidos. Revisa el formulario.';
  if (err?.code === 'ECONNABORTED') return 'El servidor está iniciando. Intenta de nuevo en unos segundos.';
  return 'Ocurrió un error al procesar tu pedido. Inténtalo de nuevo.';
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb';

const Carrito = () => {
  const { cartItems, removeFromCart, updateQty, clearCart, getCartTotal } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isLoggedIn  = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  const [form, setForm] = useState({
    nombre:    currentUser?.nombre   || '',
    cedula:    currentUser?.cedula   || '',
    email:     currentUser?.correo   || '',
    celular:   currentUser?.telefono || '',
    direccion: currentUser?.direccion || '',
  });
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [formErrors, setFormErrors]           = useState({});
  const [loading, setLoading]                 = useState(false);
  const [paymentMethod, setPaymentMethod]     = useState('transfer'); // 'transfer' | 'paypal'
  const [paypalReady, setPaypalReady]         = useState(false);

  // ref para evitar closure stale en onApprove
  const internalOrderIdRef = useRef(null);

  const TASA_IVA   = 0.15;
  const subtotal   = getCartTotal();
  const subtotalCap = cartItems
    .filter(i => (i.tipo || '').toUpperCase() === 'CAPACITACION')
    .reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const iva   = subtotalCap * TASA_IVA;
  const total = subtotal + iva;
  const fmt   = (n) => `$${n.toFixed(2)}`;

  const totalQty   = cartItems.reduce((a, i) => a + i.cantidad, 0);
  const tiposUnicos = [...new Set(cartItems.map(i => (i.tipo || '').toUpperCase()))];
  const tipoLabel   = (() => {
    if (tiposUnicos.length === 1) {
      if (tiposUnicos[0] === 'CERTIFICACION') return totalQty === 1 ? 'certificación' : 'certificaciones';
      return totalQty === 1 ? 'capacitación' : 'capacitaciones';
    }
    return totalQty === 1 ? 'curso' : 'cursos';
  })();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFormErrors(prev => ({ ...prev, comprobante: 'Solo se permiten imágenes JPG, PNG o WebP.' }));
      setComprobanteFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, comprobante: 'El archivo excede el tamaño máximo de 5 MB.' }));
      setComprobanteFile(null);
      e.target.value = '';
      return;
    }
    setComprobanteFile(file);
    setFormErrors(prev => ({ ...prev, comprobante: '' }));
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setComprobanteFile(null);
  };

  const validateBilling = () => {
    const errs = {};
    const nombre  = form.nombre.trim();
    const cedula  = form.cedula.trim().replace(/\s/g, '');
    const email   = form.email.trim().toLowerCase();
    const celular = form.celular.trim().replace(/[\s\-+]/g, '');

    if (!nombre)               errs.nombre  = 'El nombre es requerido.';
    else if (nombre.length < 3) errs.nombre = 'El nombre debe tener al menos 3 caracteres.';
    else if (nombre.length > 255) errs.nombre = 'El nombre no puede superar 255 caracteres.';

    if (!cedula)               errs.cedula  = 'La cédula o RUC es requerido.';
    else if (!CEDULA_RE.test(cedula)) errs.cedula = 'Ingresa una cédula válida (10 dígitos) o RUC (13 dígitos).';

    if (!email)                errs.email   = 'El correo es requerido.';
    else if (!EMAIL_RE.test(email)) errs.email = 'Ingresa un correo electrónico válido.';

    if (!celular)              errs.celular = 'El celular es requerido.';
    else if (!PHONE_RE.test(celular)) errs.celular = 'El celular debe tener entre 7 y 15 dígitos.';

    return errs;
  };

  const validate = () => {
    const errs = validateBilling();
    if (paymentMethod === 'transfer' && !comprobanteFile) {
      errs.comprobante = 'Debes subir tu comprobante de pago para procesar la orden.';
    }
    return errs;
  };

  // Envío por transferencia (flujo original)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) { addToast('No tienes cursos en el carrito.', 'warning'); return; }
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    if (loading) return;

    setLoading(true);
    try {
      const orderData = { items: cartItems.map(item => ({ id: Number(item.id), cantidad: item.cantidad })) };
      await cursosService.crearOrden(orderData, comprobanteFile);
      addToast(`¡Gracias ${form.nombre.trim()}! Tu pedido ha sido registrado y está en verificación.`, 'success');
      clearCart();
      navigate('/');
    } catch (err) {
      console.error('Error procesando orden:', err);
      addToast(httpErrorMsg(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Habilitar botón PayPal tras validar facturación
  const handleActivatePaypal = () => {
    const errs = validateBilling();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setPaypalReady(true);
  };

  const paypalItems = cartItems.map(item => ({ id: Number(item.id), cantidad: item.cantidad }));

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
      <div className="carrito-page">
        <div className="container carrito-layout">

          {/* COLUMNA IZQUIERDA */}
          <div className="carrito-left">
            <div className="carrito-header">
              <Link to="/" className="back-link"><i className="fa-solid fa-chevron-left" /></Link>
              <h1>Carrito de Compras</h1>
              {cartItems.length > 0 && (
                <span className="carrito-count">{totalQty} {tipoLabel}</span>
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
                      <CloudinaryImage
                        publicId={item.cloudinaryNum ? `${item.cloudinaryNum}_portada` : undefined}
                        alt={item.titulo}
                        width={120}
                        height={80}
                        fallback={item.imagen || 'https://placehold.co/120x80/002147/fff?text=Matsso'}
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
                <div className="login-required-box">
                  <i className="fa-solid fa-lock" />
                  <h3>Inicia sesión para continuar</h3>
                  <p>Necesitas una cuenta para completar tu compra. Es rápido y gratuito.</p>
                  <div className="login-required-actions">
                    <Link to="/login" state={{ from: '/carrito' }} className="btn-primary">
                      <i className="fa-regular fa-user" /> Iniciar Sesión
                    </Link>
                    <Link to="/login" state={{ from: '/carrito', tab: 'register' }} className="btn-secondary">
                      Crear Cuenta
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="facturacion-form" onSubmit={handleSubmit} noValidate>
                  {/* ── Datos de facturación ── */}
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
                        <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Juan Pérez" maxLength={255} />
                        {formErrors.nombre && <span className="form-error">{formErrors.nombre}</span>}
                      </div>
                      <div className="form-group">
                        <label>Cédula o RUC</label>
                        <input type="text" name="cedula" value={form.cedula} onChange={handleChange} placeholder="Ej: 1712345678" maxLength={13} />
                        {formErrors.cedula && <span className="form-error">{formErrors.cedula}</span>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Ej: juan@email.com" maxLength={255} />
                        {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                      </div>
                      <div className="form-group">
                        <label>Celular</label>
                        <input type="tel" name="celular" value={form.celular} onChange={handleChange} placeholder="Ej: 0991234567" maxLength={15} />
                        {formErrors.celular && <span className="form-error">{formErrors.celular}</span>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Dirección</label>
                        <input type="text" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Ej: Av. Principal 123, Quito" maxLength={255} />
                      </div>
                    </div>
                  </div>

                  {/* ── Método de pago ── */}
                  <div className="form-section payment-method-section">
                    <h3>Método de Pago</h3>
                    <div className="payment-options">
                      <div
                        className={`payment-option ${paymentMethod === 'transfer' ? 'active' : ''}`}
                        onClick={() => { setPaymentMethod('transfer'); setPaypalReady(false); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="payment-option__radio">
                          <input type="radio" readOnly checked={paymentMethod === 'transfer'} onChange={() => {}} />
                          <label>Transferencia Bancaria</label>
                        </div>
                        <span className="payment-option__badge">Recomendado</span>
                      </div>

                      <div
                        className={`payment-option ${paymentMethod === 'paypal' ? 'active' : ''}`}
                        onClick={() => { setPaymentMethod('paypal'); setPaypalReady(false); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="payment-option__radio">
                          <input type="radio" readOnly checked={paymentMethod === 'paypal'} onChange={() => {}} />
                          <label>PayPal</label>
                        </div>
                        <span className="payment-option__badge" style={{ background: '#003087', color: '#fff' }}>Tarjeta o PayPal</span>
                      </div>
                    </div>

                    {/* ── Panel Transferencia ── */}
                    {paymentMethod === 'transfer' && (
                      <>
                        <div className="payment-instructions">
                          <div className="payment-instructions__grid">
                            <div className="payment-qr-container">
                              <img src="/Produbanco.jpg" alt="Produbanco" className="payment-qr-image" />
                            </div>
                            <div className="payment-details-container">
                              <h4>Detalles de la cuenta:</h4>
                              <ul className="bank-details-list">
                                <li><strong>Banco:</strong> Produbanco</li>
                                <li><strong>Tipo de Cuenta:</strong> Ahorros</li>
                                <li><strong>Número de Cuenta:</strong> 12040223391</li>
                                <li><strong>Titular:</strong> SAPPERPROTECTION CIA. LTDA.</li>
                                <li><strong>RUC:</strong> 1792698030001</li>
                                <li><strong>Correo:</strong> capaglob@gmail.com</li>
                              </ul>
                              <div className="payment-alert">
                                <i className="fa-solid fa-circle-info" />
                                <span>Transfiere el valor exacto de <strong>{fmt(total)}</strong> y sube una foto o captura del comprobante.</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="comprobante-upload-group form-group">
                          <label>Comprobante de Pago (Captura de pantalla)</label>
                          <div className={`file-upload-wrapper ${comprobanteFile ? 'has-file' : ''}`}>
                            <input
                              type="file"
                              id="comprobante-input"
                              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
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
                                  <span>Seleccionar comprobante (PNG, JPG, WebP — Máx. 5 MB)</span>
                                </div>
                              )}
                            </label>
                          </div>
                          {formErrors.comprobante && <span className="form-error">{formErrors.comprobante}</span>}
                        </div>
                      </>
                    )}

                    {/* ── Panel PayPal ── */}
                    {paymentMethod === 'paypal' && (
                      <div className="paypal-panel">
                        <div className="payment-alert" style={{ marginBottom: 16 }}>
                          <i className="fa-solid fa-circle-info" />
                          <span>Pagarás <strong>{fmt(total)}</strong> de forma segura con PayPal. Puedes usar tu cuenta PayPal o tarjeta de crédito/débito.</span>
                        </div>

                        {!paypalReady ? (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={handleActivatePaypal}
                          >
                            Continuar con PayPal <i className="fa-solid fa-arrow-right" />
                          </button>
                        ) : (
                          <PayPalButtons
                            fundingSource="paypal"
                            style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
                            createOrder={async () => {
                              try {
                                const result = await cursosService.createPaypalOrder(paypalItems);
                                internalOrderIdRef.current = result.internalOrderId;
                                return result.paypalOrderId;
                              } catch (err) {
                                addToast(httpErrorMsg(err), 'error');
                                throw err;
                              }
                            }}
                            onApprove={async (data) => {
                              try {
                                await cursosService.capturePaypalOrder(data.orderID, internalOrderIdRef.current);
                                clearCart();
                                navigate('/pago-exitoso');
                              } catch (err) {
                                addToast(httpErrorMsg(err), 'error');
                              }
                            }}
                            onError={(err) => {
                              console.error('PayPal error:', err);
                              addToast('Ocurrió un error con PayPal. Intenta de nuevo.', 'error');
                            }}
                            onCancel={() => {
                              addToast('Pago cancelado.', 'warning');
                              navigate('/pago-cancelado');
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botón oculto para el submit de transferencia */}
                  {paymentMethod === 'transfer' && (
                    <button type="submit" id="submit-carrito" style={{ display: 'none' }} />
                  )}
                </form>
              )
            )}
          </div>

          {/* COLUMNA DERECHA — RESUMEN */}
          <div className="carrito-right">
            <div className="resumen-box">
              <h3>Resumen de Pago</h3>
              <div className="resumen-total"><strong>{fmt(total)}</strong></div>
              <div className="resumen-desglose">
                <span>Subtotal <b>{fmt(subtotal)}</b></span>
                {iva > 0
                  ? <span>IVA 15% (capacitaciones) <b>{fmt(iva)}</b></span>
                  : <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>✓ Exento de IVA</span>
                }
              </div>

              {isLoggedIn ? (
                paymentMethod === 'transfer' ? (
                  <button
                    className="btn-primary btn-checkout"
                    disabled={cartItems.length === 0 || loading}
                    onClick={() => document.getElementById('submit-carrito').click()}
                  >
                    {loading
                      ? <><i className="fa-solid fa-spinner fa-spin" /> Procesando...</>
                      : <>Confirmar pedido <i className="fa-solid fa-arrow-right" /></>}
                  </button>
                ) : (
                  /* En modo PayPal el botón está en el panel izquierdo — solo informamos */
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)', textAlign: 'center', margin: '12px 0' }}>
                    Completa el pago con el botón de PayPal.
                  </p>
                )
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
    </PayPalScriptProvider>
  );
};

export default Carrito;
