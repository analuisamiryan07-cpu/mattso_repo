import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { adminService } from '../../api/adminService';

const STATUS_COLORS = {
  PENDIENTE: { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', label: 'Pendiente' },
  PAGADA:    { bg: 'rgba(52,211,153,0.12)', color: '#34D399', label: 'Pagada' },
  RECHAZADA: { bg: 'rgba(248,113,113,0.12)', color: '#F87171', label: 'Rechazada' },
};

const FILTERS = ['TODAS', 'PENDIENTE', 'PAGADA', 'RECHAZADA'];

export default function AdminDashboard() {
  const { isAuthenticated, logout, getKey } = useAdmin();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('TODAS');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin/login');
  }, [isAuthenticated, navigate]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAllOrders(getKey());
      setOrders(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('inválida')) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [getKey, logout, navigate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAction = async (orderId, estado) => {
    setActionLoading(orderId + estado);
    try {
      await adminService.updateStatus(getKey(), orderId, estado);
      setToast(estado === 'PAGADA' ? '✓ Pago aprobado' : '✗ Orden rechazada');
      setTimeout(() => setToast(''), 3000);
      await fetchOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const displayed = filter === 'TODAS' ? orders : orders.filter((o) => o.estado === filter);

  const stats = {
    total: orders.length,
    pendiente: orders.filter((o) => o.estado === 'PENDIENTE').length,
    pagada: orders.filter((o) => o.estado === 'PAGADA').length,
    rechazada: orders.filter((o) => o.estado === 'RECHAZADA').length,
    ingresos: orders
      .filter((o) => o.estado === 'PAGADA')
      .reduce((a, o) => a + o.total, 0),
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.brand}>MATSSO</span>
          <span style={s.brandSub}>Panel Admin</span>
        </div>
        <div style={s.headerRight}>
          <button onClick={fetchOrders} style={s.refreshBtn} disabled={loading}>
            {loading ? '…' : '↻ Actualizar'}
          </button>
          <button onClick={() => { logout(); navigate('/admin/login'); }} style={s.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={s.content}>
        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Total órdenes', value: stats.total, color: '#4F8EF7' },
            { label: 'Pendientes', value: stats.pendiente, color: '#FBBF24' },
            { label: 'Aprobadas', value: stats.pagada, color: '#34D399' },
            { label: 'Rechazadas', value: stats.rechazada, color: '#F87171' },
            { label: 'Ingresos confirmados', value: `$${stats.ingresos.toFixed(2)}`, color: '#A78BFA' },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={{ ...s.statVal, color: st.color }}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={s.filters}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}
            >
              {f === 'TODAS' ? `Todas (${stats.total})` :
               f === 'PENDIENTE' ? `Pendientes (${stats.pendiente})` :
               f === 'PAGADA' ? `Aprobadas (${stats.pagada})` :
               `Rechazadas (${stats.rechazada})`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div style={s.errorBox}>{error}</div>}

        {/* Table */}
        {loading ? (
          <div style={s.empty}>Cargando órdenes…</div>
        ) : displayed.length === 0 ? (
          <div style={s.empty}>No hay órdenes en esta categoría.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Cliente', 'Correo', 'Certificaciones', 'Total', 'Fecha', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((order) => {
                  const st = STATUS_COLORS[order.estado] || STATUS_COLORS.PENDIENTE;
                  const fecha = new Date(order.fecha_orden).toLocaleDateString('es-EC', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  });
                  return (
                    <tr key={order.id} style={s.tr}>
                      <td style={s.td}>
                        <span style={s.orderId}>#{order.id}</span>
                      </td>
                      <td style={s.td}>
                        <div style={s.clientName}>{order.cliente.nombre}</div>
                        <div style={s.clientCedula}>{order.cliente.cedula}</div>
                      </td>
                      <td style={s.td}>
                        <span style={s.email}>{order.cliente.correo}</span>
                      </td>
                      <td style={s.td}>
                        <div style={s.certList}>
                          {order.items.map((item, i) => (
                            <div key={i} style={s.certItem}>{item.producto}</div>
                          ))}
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.totalAmt}>${order.total.toFixed(2)}</span>
                      </td>
                      <td style={s.td}><span style={s.date}>{fecha}</span></td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={s.td}>
                        {order.estado === 'PENDIENTE' ? (
                          <div style={s.actions}>
                            <button
                              style={s.approveBtn}
                              disabled={!!actionLoading}
                              onClick={() => handleAction(order.id, 'PAGADA')}
                            >
                              {actionLoading === order.id + 'PAGADA' ? '…' : '✓ Aprobar'}
                            </button>
                            <button
                              style={s.rejectBtn}
                              disabled={!!actionLoading}
                              onClick={() => handleAction(order.id, 'RECHAZADA')}
                            >
                              {actionLoading === order.id + 'RECHAZADA' ? '…' : '✗ Rechazar'}
                            </button>
                            {order.comprobante_url && (
                              <a
                                href={order.comprobante_url}
                                target="_blank"
                                rel="noreferrer"
                                style={s.viewBtn}
                              >
                                Ver comprobante
                              </a>
                            )}
                          </div>
                        ) : (
                          order.comprobante_url ? (
                            <a href={order.comprobante_url} target="_blank" rel="noreferrer" style={s.viewBtn}>
                              Ver comprobante
                            </a>
                          ) : (
                            <span style={s.noAction}>—</span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={s.toast}>{toast}</div>
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0D1117',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    color: '#DDE3F4',
  },
  header: {
    background: '#161B27',
    borderBottom: '1px solid #252D42',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLeft: { display: 'flex', alignItems: 'baseline', gap: '10px' },
  brand: { fontSize: '18px', fontWeight: '800', color: '#FFD700', letterSpacing: '0.06em' },
  brandSub: { fontSize: '11px', color: '#6B748F', letterSpacing: '0.08em', textTransform: 'uppercase' },
  headerRight: { display: 'flex', gap: '8px' },
  refreshBtn: {
    background: 'transparent', border: '1px solid #252D42', color: '#9BA6C4',
    borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
  },
  logoutBtn: {
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
    color: '#F87171', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
  },
  content: { padding: '24px', maxWidth: '1400px', margin: '0 auto' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' },
  statCard: {
    background: '#161B27', border: '1px solid #252D42', borderRadius: '10px',
    padding: '16px 18px',
  },
  statVal: { fontSize: '22px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', marginBottom: '4px' },
  statLabel: { fontSize: '11px', color: '#6B748F', textTransform: 'uppercase', letterSpacing: '0.06em' },
  filters: { display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' },
  filterBtn: {
    background: 'transparent', border: '1px solid #252D42', color: '#6B748F',
    borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
  },
  filterActive: { background: '#192030', border: '1px solid #4F8EF7', color: '#4F8EF7' },
  errorBox: {
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
    color: '#F87171', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px',
  },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#6B748F', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: {
    textAlign: 'left', padding: '10px 12px', fontSize: '10px', fontWeight: '700',
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B748F',
    borderBottom: '1px solid #252D42', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid rgba(37,45,66,0.6)' },
  td: { padding: '12px', verticalAlign: 'top' },
  orderId: { fontFamily: 'monospace', fontSize: '12px', color: '#4F8EF7', fontWeight: '600' },
  clientName: { fontWeight: '600', color: '#DDE3F4', marginBottom: '2px' },
  clientCedula: { fontSize: '11px', color: '#6B748F' },
  email: { fontSize: '12px', color: '#9BA6C4' },
  certList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  certItem: {
    fontSize: '11px', color: '#9BA6C4', background: '#192030',
    borderRadius: '4px', padding: '2px 6px', display: 'inline-block',
  },
  totalAmt: { fontWeight: '700', color: '#DDE3F4', fontVariantNumeric: 'tabular-nums' },
  date: { fontSize: '12px', color: '#9BA6C4', whiteSpace: 'nowrap' },
  badge: { fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '100px' },
  actions: { display: 'flex', flexDirection: 'column', gap: '4px' },
  approveBtn: {
    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
    color: '#34D399', borderRadius: '5px', padding: '5px 10px', fontSize: '11px',
    cursor: 'pointer', fontWeight: '600',
  },
  rejectBtn: {
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
    color: '#F87171', borderRadius: '5px', padding: '5px 10px', fontSize: '11px',
    cursor: 'pointer', fontWeight: '600',
  },
  viewBtn: {
    fontSize: '11px', color: '#4F8EF7', textDecoration: 'none',
    padding: '5px 0', display: 'inline-block',
  },
  noAction: { color: '#252D42' },
  toast: {
    position: 'fixed', bottom: '24px', right: '24px',
    background: '#192030', border: '1px solid #34D399', color: '#34D399',
    borderRadius: '8px', padding: '12px 20px', fontSize: '13px', fontWeight: '600',
    zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
};
