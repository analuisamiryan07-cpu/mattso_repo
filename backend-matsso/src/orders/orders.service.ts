import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

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

    const total = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const totalConIva = total * 1.15;

    const order = await this.prisma.$transaction(async (tx) => {
      let dbCliente = await tx.cliente.findUnique({ where: { cedula: cliente.cedula } });

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

      let userWeb = await tx.usuarioWeb.findUnique({ where: { correo: cliente.email } });

      if (!userWeb) {
        const tempPassword = randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        userWeb = await tx.usuarioWeb.create({
          data: {
            correo: cliente.email,
            password_hash: passwordHash,
            cliente_id: dbCliente.id,
            rol: 'ESTUDIANTE',
          },
        });
      }

      const dbOrder = await tx.orden.create({
        data: {
          usuario_id: userWeb.id,
          total: totalConIva,
          estado: 'PENDIENTE',
          metodo_pago: 'TRANSFERENCIA',
          comprobante_url: comprobanteUrl || null,
        },
      });

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

  // ── Módulo Aprobación de Pagos ─────────────────────────────────────────────

  async getAllOrders() {
    const orders = await this.prisma.orden.findMany({
      orderBy: { fecha_orden: 'desc' },
      take: 200,
      include: {
        usuario: { include: { cliente: true } },
        items: { include: { producto: true } },
      },
    });

    return orders.map((o) => ({
      id: Number(o.id),
      estado: o.estado,
      total: Number(o.total),
      fecha_orden: o.fecha_orden,
      metodo_pago: o.metodo_pago,
      comprobante_url: o.comprobante_url,
      cliente: o.usuario.cliente
        ? {
            nombre: o.usuario.cliente.nombre,
            cedula: o.usuario.cliente.cedula,
            correo: o.usuario.cliente.correo,
            telefono: o.usuario.cliente.telefono,
          }
        : { nombre: o.usuario.correo, cedula: '-', correo: o.usuario.correo, telefono: '-' },
      items: o.items.map((i) => ({
        producto: i.producto.titulo,
        cantidad: i.cantidad,
        precio: Number(i.precio_unitario),
      })),
    }));
  }

  async updateOrderStatus(id: number, estado: 'PAGADA' | 'RECHAZADA') {
    const order = await this.prisma.orden.findUnique({ where: { id: BigInt(id) } });
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);

    const updated = await this.prisma.orden.update({
      where: { id: BigInt(id) },
      data: { estado },
      include: {
        usuario: {
          include: {
            cliente: true,
          },
        },
      },
    });

    return {
      id: Number(updated.id),
      estado: updated.estado,
      mensaje: estado === 'PAGADA' ? 'Pago aprobado con éxito.' : 'Orden rechazada.',
      cliente: updated.usuario.cliente
        ? {
            nombre: updated.usuario.cliente.nombre,
            cedula: updated.usuario.cliente.cedula,
            correo: updated.usuario.cliente.correo,
            telefono: updated.usuario.cliente.telefono,
            direccion: updated.usuario.cliente.direccion,
            ciudad: updated.usuario.cliente.ciudad,
            lugar: updated.usuario.cliente.lugar,
            esquema: updated.usuario.cliente.esquema,
            tipo_examen: updated.usuario.cliente.tipo_examen,
          }
        : null,
    };
  }
}
