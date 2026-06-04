/**
 * Normaliza un objeto de curso/certificación a un formato unificado para el carrito.
 * Acepta tanto el esquema del backend NestJS ({titulo, precio, imagen})
 * como el esquema legacy ({title, price, image}).
 *
 * @param {Object} item - Objeto del curso o certificación
 * @returns {Object} - Ítem normalizado
 */
export const normalizeCartItem = (item) => ({
  id: item.id,
  titulo: item.titulo ?? item.title ?? 'Sin título',
  precio: item.precio ?? item.price ?? 0,
  imagen: item.imagen ?? item.image ?? item.img ?? '',
  modalidad: item.modalidad ?? 'Virtual',
  tipo: item.tipo ?? 'capacitacion',
  cantidad: 1,
});
