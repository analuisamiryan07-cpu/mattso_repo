const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function adminHeaders(key) {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': key,
  };
}

export const adminService = {
  async getAllOrders(key) {
    const res = await fetch(`${BASE}/ordenes`, {
      headers: adminHeaders(key),
    });
    if (res.status === 401) throw new Error('Clave de administrador inválida.');
    if (!res.ok) throw new Error('Error al obtener órdenes del servidor.');
    return res.json();
  },

  async updateStatus(key, orderId, estado) {
    const res = await fetch(`${BASE}/ordenes/${orderId}/estado`, {
      method: 'PATCH',
      headers: adminHeaders(key),
      body: JSON.stringify({ estado }),
    });
    if (res.status === 401) throw new Error('Clave de administrador inválida.');
    if (!res.ok) throw new Error('Error al actualizar estado de la orden.');
    return res.json();
  },
};
