import {
  Injectable,
  NotFoundException,
  Optional,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { EMAIL_QUEUE, EMAIL_JOBS } from '../queue/queue.constants';
import { CreateOrderDto } from './dto/create-order.dto';

const TASA_IVA = 0.15;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    @Optional() @InjectQueue(EMAIL_QUEUE) private readonly emailQueue?: Queue,
  ) {}

  async createOrder(dto: CreateOrderDto, usuarioId: number, comprobanteUrl: string) {
    const { items } = dto;

    // Obtener precios reales desde la base de datos — nunca del cliente
    const productIds = items.map((i) => BigInt(i.id));
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productIds }, activo: true },
      select: { id: true, precio: true, titulo: true, tipo: true },
    });

    if (productos.length !== productIds.length) {
      const found = new Set(productos.map((p) => Number(p.id)));
      const missing = items.filter((i) => !found.has(i.id)).map((i) => i.id);
      throw new BadRequestException(`Productos no encontrados o inactivos: ${missing.join(', ')}`);
    }

    const precioMap = new Map(productos.map((p) => [Number(p.id), Number(p.precio)]));
    const tipoMap  = new Map(productos.map((p) => [Number(p.id), p.tipo as string]));

    const subtotal = items.reduce(
      (acc, item) => acc + (precioMap.get(item.id) ?? 0) * item.cantidad,
      0,
    );
    // IVA solo en CAPACITACION — las certificaciones están exentas
    const subtotalConIva = items.reduce((acc, item) => {
      const tipo = tipoMap.get(item.id) ?? 'CAPACITACION';
      return tipo === 'CAPACITACION'
        ? acc + (precioMap.get(item.id) ?? 0) * item.cantidad
        : acc;
    }, 0);
    const iva = subtotalConIva * TASA_IVA;
    const total = subtotal + iva;

    // Verificar que el usuario existe
    const userWeb = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(usuarioId) },
      include: { cliente: true },
    });
    if (!userWeb) throw new NotFoundException('Usuario no encontrado.');

    const order = await this.prisma.$transaction(async (tx) => {
      const dbOrder = await tx.orden.create({
        data: {
          usuario_id: BigInt(usuarioId),
          total,
          estado: 'PENDIENTE',
          metodo_pago: 'TRANSFERENCIA',
          comprobante_url: comprobanteUrl,
        },
      });

      for (const item of items) {
        await tx.ordenItem.create({
          data: {
            orden_id: dbOrder.id,
            producto_id: BigInt(item.id),
            precio_unitario: precioMap.get(item.id)!, // precio de la DB, nunca del cliente
            cantidad: item.cantidad,
          },
        });
      }

      return dbOrder;
    });

    // Notificación por correo
    const correo = userWeb.cliente?.correo ?? userWeb.correo;
    const nombre = userWeb.cliente?.nombre ?? userWeb.correo;
    const emailPayload = {
      to: correo,
      nombre,
      orderId: Number(order.id),
      total,
      iva,
      items: productos.map((p) => ({ producto: p.titulo, precio: Number(p.precio) })),
    };

    const sendConfirmacionDirecta = () =>
      this.emailService
        .sendOrderConfirmation(emailPayload)
        .catch((err) => this.logger.error('Error enviando email de confirmación:', err));

    if (this.emailQueue) {
      await this.emailQueue
        .add(EMAIL_JOBS.ORDER_CREATED, emailPayload)
        .catch((err) => {
          this.logger.error('Error encolando email, enviando directamente:', err);
          sendConfirmacionDirecta();
        });
    } else {
      sendConfirmacionDirecta();
    }

    return {
      id: Number(order.id),
      usuario_id: Number(order.usuario_id),
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      estado: order.estado,
      fecha_orden: order.fecha_orden,
      metodo_pago: order.metodo_pago,
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
            nombre:   o.usuario.cliente.nombre,
            cedula:   o.usuario.cliente.cedula,
            correo:   o.usuario.cliente.correo,
            telefono: o.usuario.cliente.telefono,
            direccion: o.usuario.cliente.direccion ?? null,
            ciudad:   o.usuario.cliente.ciudad    ?? null,
          }
        : { nombre: o.usuario.correo, cedula: '-', correo: o.usuario.correo, telefono: '-', direccion: null, ciudad: null },
      items: o.items.map((i) => ({
        producto: i.producto.titulo,
        cantidad: i.cantidad,
        precio: Number(i.precio_unitario),
      })),
    }));
  }

  async updateOrderStatus(id: number, estado: 'PAGADA' | 'RECHAZADA', motivo?: string) {
    const order = await this.prisma.orden.findUnique({
      where: { id: BigInt(id) },
      include: { usuario: { include: { cliente: true } }, items: { include: { producto: true } } },
    });
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada.`);

    // Solo se puede transicionar desde PENDIENTE
    if (order.estado !== 'PENDIENTE') {
      throw new ConflictException(
        `La orden ${id} ya fue procesada (estado actual: ${order.estado}). No se puede modificar.`,
      );
    }

    const updated = await this.prisma.orden.update({
      where: { id: BigInt(id) },
      data: { estado },
      include: { usuario: { include: { cliente: true } } },
    });

    const correo = updated.usuario.cliente?.correo ?? updated.usuario.correo;
    const nombre = updated.usuario.cliente?.nombre ?? updated.usuario.correo;

    if (correo) {
      const jobName = estado === 'PAGADA' ? EMAIL_JOBS.PAYMENT_APPROVED : EMAIL_JOBS.PAYMENT_REJECTED;
      const emailPayload =
        estado === 'PAGADA'
          ? {
              to: correo,
              nombre,
              orderId: id,
              items: order.items.map((i) => ({ producto: i.producto.titulo })),
              cedula:   updated.usuario.cliente?.cedula    ?? undefined,
              telefono: updated.usuario.cliente?.telefono  ?? undefined,
              direccion: updated.usuario.cliente?.direccion ?? undefined,
            }
          : { to: correo, nombre, orderId: id, motivo: motivo ?? 'Sin especificar' };

      const sendEmailDirect = () => {
        const sendFn =
          estado === 'PAGADA'
            ? this.emailService.sendPaymentApproved(emailPayload as any)
            : this.emailService.sendPaymentRejected(emailPayload as any);
        sendFn.catch((err) => this.logger.error('Error enviando email de estado:', err));
      };

      if (this.emailQueue) {
        await this.emailQueue
          .add(jobName, emailPayload)
          .catch((err) => {
            this.logger.error('Error encolando email, enviando directamente:', err);
            sendEmailDirect();
          });
      } else {
        sendEmailDirect();
      }
    }

    return {
      id: Number(updated.id),
      estado: updated.estado,
      mensaje: estado === 'PAGADA' ? 'Pago aprobado con éxito.' : 'Orden rechazada.',
      motivo: estado === 'RECHAZADA' ? motivo : undefined,
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
