import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaypalApiService } from './paypal-api.service';
import { EmailService } from '../../email/email.service';

const CURRENCY = process.env.PAYPAL_CURRENCY ?? 'USD';
const TASA_IVA = 0.15;

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly api: PaypalApiService,
    private readonly emailService: EmailService,
  ) {}

  // ── Crear orden interna + orden PayPal en un solo paso ──────
  async createPaypalOrder(items: { id: number; cantidad: number }[], usuarioId: number) {
    // Obtener precios reales desde la BD
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
    const tipoMap   = new Map(productos.map((p) => [Number(p.id), p.tipo as string]));

    const subtotal = items.reduce(
      (acc, item) => acc + (precioMap.get(item.id) ?? 0) * item.cantidad,
      0,
    );
    const subtotalCap = items.reduce((acc, item) => {
      return tipoMap.get(item.id) === 'CAPACITACION'
        ? acc + (precioMap.get(item.id) ?? 0) * item.cantidad
        : acc;
    }, 0);
    const iva   = subtotalCap * TASA_IVA;
    const total = parseFloat((subtotal + iva).toFixed(2));

    // Verificar que el usuario existe
    const userWeb = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(usuarioId) },
    });
    if (!userWeb) throw new NotFoundException('Usuario no encontrado.');

    // Crear la orden interna y el registro de pago en una transacción
    const orden = await this.prisma.$transaction(async (tx) => {
      const dbOrder = await tx.orden.create({
        data: {
          usuario_id:  BigInt(usuarioId),
          total,
          estado:      'PENDIENTE',
          metodo_pago: 'PAYPAL',
        },
      });

      for (const item of items) {
        await tx.ordenItem.create({
          data: {
            orden_id:       dbOrder.id,
            producto_id:    BigInt(item.id),
            precio_unitario: precioMap.get(item.id)!,
            cantidad:       item.cantidad,
          },
        });
      }

      return dbOrder;
    });

    const internalOrderId = Number(orden.id);

    // Crear la orden en PayPal
    const token          = await this.api.getAccessToken();
    const idempotencyKey = `create-${internalOrderId}-${Date.now()}`;
    const { id: paypalOrderId } = await this.api.createOrder(
      token,
      internalOrderId.toString(),
      total.toFixed(2),
      CURRENCY,
      idempotencyKey,
    );

    // Registrar el pago en estado CREADO
    await this.prisma.pago.create({
      data: {
        orden_id:        BigInt(internalOrderId),
        paypal_order_id: paypalOrderId,
        monto:           total,
        moneda:          CURRENCY,
        estado:          'CREADO',
      },
    });

    return { paypalOrderId, internalOrderId };
  }

  // ── Capturar pago y confirmar orden ─────────────────────────
  async capturePaypalOrder(paypalOrderId: string, internalOrderId: number, usuarioId: number) {
    const orden = await this.prisma.orden.findUnique({
      where: { id: BigInt(internalOrderId) },
      include: { items: { include: { producto: true } } },
    });

    if (!orden) throw new NotFoundException(`Orden ${internalOrderId} no encontrada.`);
    if (Number(orden.usuario_id) !== usuarioId)
      throw new BadRequestException('La orden no pertenece al usuario autenticado.');
    if (orden.estado === 'PAGADA')
      throw new ConflictException('Esta orden ya fue pagada.');

    const pago = await this.prisma.pago.findUnique({ where: { paypal_order_id: paypalOrderId } });
    if (!pago) throw new NotFoundException('Registro de pago no encontrado.');
    if (Number(pago.orden_id) !== internalOrderId)
      throw new BadRequestException('El paypalOrderId no corresponde a esta orden.');

    const token    = await this.api.getAccessToken();
    const captured = await this.api.captureOrder(token, paypalOrderId);

    const captureUnit   = captured?.purchase_units?.[0];
    const captureDetail = captureUnit?.payments?.captures?.[0];

    if (captured.status !== 'COMPLETED' || captureDetail?.status !== 'COMPLETED') {
      this.logger.warn(`Captura no completada: ${JSON.stringify(captured.status)}`);
      await this.prisma.pago.update({
        where: { paypal_order_id: paypalOrderId },
        data:  { estado: 'REVISION_REQUERIDA', respuesta_raw: captured },
      });
      throw new BadRequestException('El pago no fue completado por PayPal. Contacte soporte.');
    }

    const capturedAmount   = parseFloat(captureDetail?.amount?.value ?? '0');
    const capturedCurrency = captureDetail?.amount?.currency_code ?? '';
    const customId         = captureUnit?.custom_id ?? '';
    const captureId        = captureDetail?.id ?? '';

    // Recalcular total esperado
    const subtotalCap = orden.items.reduce((acc, item) =>
      item.producto.tipo === 'CAPACITACION'
        ? acc + Number(item.precio_unitario) * item.cantidad
        : acc, 0);
    const subtotal = orden.items.reduce(
      (acc, item) => acc + Number(item.precio_unitario) * item.cantidad, 0);
    const expectedTotal = parseFloat((subtotal + subtotalCap * TASA_IVA).toFixed(2));

    if (Math.abs(capturedAmount - expectedTotal) > 0.01)
      throw new BadRequestException(`Monto capturado (${capturedAmount}) no coincide con el esperado (${expectedTotal}).`);
    if (capturedCurrency !== CURRENCY)
      throw new BadRequestException(`Moneda incorrecta: ${capturedCurrency}`);
    if (customId && customId !== internalOrderId.toString())
      throw new BadRequestException('custom_id no coincide con la orden interna.');

    const correo = captureDetail?.payer?.email_address
      ?? captured?.payment_source?.paypal?.email_address
      ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.pago.update({
        where: { paypal_order_id: paypalOrderId },
        data: {
          capture_id:     captureId,
          estado:         'COMPLETADO',
          correo_pagador: correo,
          respuesta_raw:  captured,
          paid_at:        new Date(),
          updated_at:     new Date(),
        },
      });

      await tx.orden.update({
        where: { id: BigInt(internalOrderId) },
        data:  { estado: 'PAGADA' },
      });
    });

    this.logger.log(`Pago completado — orden ${internalOrderId}, capture ${captureId}`);

    // Enviar correo de pago aprobado (PayPal confirma el pago al instante)
    try {
      const userWeb = await this.prisma.usuarioWeb.findUnique({
        where: { id: BigInt(usuarioId) },
        include: { cliente: true },
      });
      const emailTo       = userWeb?.cliente?.correo ?? (userWeb as any)?.correo ?? null;
      const nombreUsuario = userWeb?.cliente?.nombre ?? (userWeb as any)?.correo ?? 'Cliente';

      if (emailTo) {
        await this.emailService.sendPaymentApproved({
          to:        emailTo,
          nombre:    nombreUsuario,
          orderId:   internalOrderId,
          items:     orden.items.map((item) => ({ producto: item.producto.titulo })),
          cedula:    userWeb?.cliente?.cedula    ?? undefined,
          telefono:  userWeb?.cliente?.telefono  ?? undefined,
          direccion: userWeb?.cliente?.direccion ?? undefined,
        }).catch((err) => this.logger.error('Error enviando email de aprobación PayPal:', err));
      }
    } catch (err) {
      this.logger.error('Error preparando email de aprobación PayPal:', err);
    }

    return {
      mensaje:   'Pago completado con éxito.',
      orderId:   internalOrderId,
      captureId,
      total:     capturedAmount,
    };
  }
}
