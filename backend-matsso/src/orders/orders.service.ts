import { Injectable, NotFoundException, Optional, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { EMAIL_QUEUE, EMAIL_JOBS } from '../queue/queue.constants';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    @Optional() @InjectQueue(EMAIL_QUEUE) private readonly emailQueue?: Queue,
  ) {}

  async createOrder(dto: {
    cliente: { nombre: string; cedula: string; email: string; celular: string };
    items: Array<{ id: number; cantidad: number; precio: number }>;
    comprobanteUrl?: string;
  }) {
    const { cliente, items, comprobanteUrl } = dto;

    if (!items || items.length === 0) {
      throw new Error('La orden debe contener al menos un item.');
    }

    const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
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

      return { dbOrder, dbCliente };
    });

    // Encolar email de confirmación de forma asíncrona
    const emailPayload = {
      to: cliente.email,
      nombre: cliente.nombre,
      orderId: Number(order.dbOrder.id),
      total: totalConIva,
      items: items.map((i) => ({ producto: `Certificación #${i.id}`, precio: i.precio })),
    };

    if (this.emailQueue) {
      await this.emailQueue
        .add(EMAIL_JOBS.ORDER_CREATED, emailPayload)
        .catch((err) => this.logger.error('Error encolando email de confirmación:', err));
    } else {
      // Sin Redis: enviar email directamente (síncrono, no bloquea al usuario porque está en try/catch)
      this.emailService.sendOrderConfirmation(emailPayload).catch((err) =>
        this.logger.error('Error enviando email de confirmación:', err),
      );
    }

    return {
      id: Number(order.dbOrder.id),
      usuario_id: Number(order.dbOrder.usuario_id),
      total: Number(order.dbOrder.total),
      estado: order.dbOrder.estado,
      fecha_orden: order.dbOrder.fecha_orden,
      metodo_pago: order.dbOrder.metodo_pago,
      comprobante_url: order.dbOrder.comprobante_url,
    };
  }

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
    const order = await this.prisma.orden.findUnique({
      where: { id: BigInt(id) },
      include: { usuario: { include: { cliente: true } }, items: { include: { producto: true } } },
    });
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);

    const updated = await this.prisma.orden.update({
      where: { id: BigInt(id) },
      data: { estado },
      include: { usuario: { include: { cliente: true } } },
    });

    const correo = updated.usuario.cliente?.correo || updated.usuario.correo;
    const nombre = updated.usuario.cliente?.nombre || updated.usuario.correo;

    if (correo) {
      const jobName =
        estado === 'PAGADA' ? EMAIL_JOBS.PAYMENT_APPROVED : EMAIL_JOBS.PAYMENT_REJECTED;

      const emailPayload =
        estado === 'PAGADA'
          ? {
              to: correo,
              nombre,
              orderId: id,
              items: order.items.map((i) => ({ producto: i.producto.titulo })),
            }
          : { to: correo, nombre, orderId: id };

      if (this.emailQueue) {
        await this.emailQueue
          .add(jobName, emailPayload)
          .catch((err) => this.logger.error('Error encolando email de estado:', err));
      } else {
        const sendFn =
          estado === 'PAGADA'
            ? this.emailService.sendPaymentApproved(emailPayload as any)
            : this.emailService.sendPaymentRejected(emailPayload as any);
        sendFn.catch((err) => this.logger.error('Error enviando email de estado:', err));
      }
    }

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
