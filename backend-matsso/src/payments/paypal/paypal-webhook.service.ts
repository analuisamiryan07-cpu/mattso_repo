import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaypalApiService } from './paypal-api.service';
import { EnrollmentService } from '../../lms/enrollment/enrollment.service';

@Injectable()
export class PaypalWebhookService {
  private readonly logger = new Logger(PaypalWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly api: PaypalApiService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  async handleWebhook(headers: Record<string, string>, rawBody: string): Promise<void> {
    // ── 1. Verificar firma ───────────────────────────────────
    const token = await this.api.getAccessToken();
    const valid = await this.api.verifyWebhookSignature(token, headers, rawBody);

    if (!valid) {
      this.logger.warn('Webhook PayPal con firma inválida — ignorado.');
      return;
    }

    const event = JSON.parse(rawBody);
    const eventoId   = event.id as string;
    const tipoEvento = event.event_type as string;
    if (typeof eventoId !== 'string' || !eventoId || eventoId.length > 100) {
      this.logger.warn('Webhook PayPal sin id de evento válido — ignorado.');
      return;
    }

    // ── 2. Idempotencia — ignorar duplicados ─────────────────
    const existe = await this.prisma.webhookEvent.findUnique({
      where: { proveedor_evento_id: { proveedor: 'PAYPAL', evento_id: eventoId } },
    });

    if (existe?.procesado) {
      this.logger.log(`Webhook ${eventoId} ya procesado — ignorado.`);
      return;
    }

    // Registrar evento si no existe
    if (!existe) {
      await this.prisma.webhookEvent.create({
        data: { evento_id: eventoId, tipo_evento: tipoEvento, payload: event },
      });
    }

    // ── 3. Procesar según tipo de evento ─────────────────────
    try {
      if (tipoEvento === 'PAYMENT.CAPTURE.COMPLETED') {
        await this.processCaptureCompleted(event);
      } else if (tipoEvento === 'PAYMENT.CAPTURE.DENIED') {
        await this.processCaptureDenied(event);
      } else {
        this.logger.log(`Webhook tipo ${tipoEvento} recibido — sin acción específica.`);
      }

      // Marcar como procesado
      await this.prisma.webhookEvent.update({
        where: { proveedor_evento_id: { proveedor: 'PAYPAL', evento_id: eventoId } },
        data: { procesado: true, procesado_at: new Date() },
      });
    } catch (err: any) {
      this.logger.error(`Error procesando webhook ${eventoId}:`, err?.message);
    }
  }

  private async processCaptureCompleted(event: any): Promise<void> {
    const captureId     = event.resource?.id as string;
    const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id as string;

    if (!captureId) return;

    const pago = await this.prisma.pago.findUnique({ where: { capture_id: captureId } });

    // Si ya fue capturado por el flujo normal → solo reconciliar
    if (pago?.estado === 'COMPLETADO') {
      this.logger.log(`Webhook CAPTURE.COMPLETED para capture ${captureId} ya procesado vía API.`);
      return;
    }

    // Caso edge: captura que llegó primero por webhook
    if (paypalOrderId) {
      const pagoPorOrder = await this.prisma.pago.findUnique({ where: { paypal_order_id: paypalOrderId } });
      if (pagoPorOrder) {
        // Defensa adicional: el monto/moneda del evento debe coincidir con lo registrado.
        const monto = parseFloat(event.resource?.amount?.value ?? 'NaN');
        const moneda = event.resource?.amount?.currency_code;
        if (!Number.isFinite(monto) || Math.abs(monto - Number(pagoPorOrder.monto)) > 0.01 || moneda !== pagoPorOrder.moneda) {
          this.logger.error(`Webhook CAPTURE.COMPLETED con monto/moneda inesperados para orden ${pagoPorOrder.orden_id} — requiere revisión.`);
          await this.prisma.pago.update({
            where: { paypal_order_id: paypalOrderId },
            data: { estado: 'REVISION_REQUERIDA', updated_at: new Date() },
          });
          return;
        }

        const orden = await this.prisma.$transaction(async (tx) => {
          await tx.pago.update({
            where: { paypal_order_id: paypalOrderId },
            data: { capture_id: captureId, estado: 'COMPLETADO', paid_at: new Date(), updated_at: new Date() },
          });
          // Solo transiciona si aún no estaba PAGADA (la captura síncrona pudo ganar la carrera).
          const { count } = await tx.orden.updateMany({
            where: { id: pagoPorOrder.orden_id, estado: { not: 'PAGADA' } },
            data:  { estado: 'PAGADA' },
          });
          if (count !== 1) return null;
          return tx.orden.findUniqueOrThrow({ where: { id: pagoPorOrder.orden_id }, include: { items: true } });
        });
        if (!orden) {
          this.logger.log(`Orden ${pagoPorOrder.orden_id} ya estaba PAGADA — webhook solo reconcilió el pago.`);
          return;
        }
        this.logger.log(`Orden ${pagoPorOrder.orden_id} marcada PAGADA vía webhook.`);

        await this.enrollmentService.enrollAllItemsFromOrder(
          Number(orden.id),
          Number(orden.usuario_id),
          orden.items.map((i) => ({ id: Number(i.id), producto_id: Number(i.producto_id) })),
        );
      }
    }
  }

  private async processCaptureDenied(event: any): Promise<void> {
    const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id as string;
    if (!paypalOrderId) return;

    const pago = await this.prisma.pago.findUnique({ where: { paypal_order_id: paypalOrderId } });
    if (!pago) return;

    await this.prisma.pago.update({
      where: { paypal_order_id: paypalOrderId },
      data: { estado: 'DENEGADO', updated_at: new Date() },
    });
    this.logger.warn(`Pago denegado por PayPal — orden ${pago.orden_id}`);
  }
}
