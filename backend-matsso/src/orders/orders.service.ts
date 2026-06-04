import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: {
    cliente: { nombre: string; cedula: string; email: string; celular: string };
    items: Array<{ id: number; cantidad: number; precio: number }>;
    comprobanteUrl?: string;
  }) {
    const { cliente, items, comprobanteUrl } = dto;

    if (!items || items.length === 0) {
      throw new Error('La orden debe contener al menos un item.');
    }

    // Calcular total
    const total = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    // Aplicar IVA (15%)
    const totalConIva = total * 1.15;

    // Ejecutar transaccionalmente
    const order = await this.prisma.$transaction(async (tx) => {
      // Buscar/crear cliente por cédula
      let dbCliente = await tx.cliente.findUnique({
        where: { cedula: cliente.cedula },
      });

      if (!dbCliente) {
        dbCliente = await tx.cliente.create({
          data: {
            nombre: cliente.nombre,
            cedula: cliente.cedula,
            correo: cliente.email,
            telefono: cliente.celular,
            fecha: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      // Buscar/crear usuario web por correo
      let userWeb = await tx.usuarioWeb.findUnique({
        where: { correo: cliente.email },
      });

      if (!userWeb) {
        userWeb = await tx.usuarioWeb.create({
          data: {
            correo: cliente.email,
            password_hash: '$2b$10$dummyhashplaceholderforcheckout',
            cliente_id: dbCliente.id,
            rol: 'ESTUDIANTE',
          },
        });
      }

      // Crear Orden
      const dbOrder = await tx.orden.create({
        data: {
          usuario_id: userWeb.id,
          total: totalConIva,
          estado: 'PENDIENTE',
          metodo_pago: 'TRANSFERENCIA',
          comprobante_url: comprobanteUrl || null,
        },
      });

      // Crear OrdenItems
      for (const item of items) {
        await tx.ordenItem.create({
          data: {
            orden_id: dbOrder.id,
            producto_id: BigInt(item.id),
            precio_unitario: item.precio,
            cantidad: item.cantidad,
          },
        });
      }

      return dbOrder;
    });

    return {
      id: Number(order.id),
      usuario_id: Number(order.usuario_id),
      total: Number(order.total),
      estado: order.estado,
      fecha_orden: order.fecha_orden,
      metodo_pago: order.metodo_pago,
      comprobante_url: order.comprobante_url,
    };
  }
}
