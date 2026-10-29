// POST /api/lms/webhooks/enrollment — Moodles/arquitectura_lms_nube.md §5.
// Protegido por firma HMAC (no JWT ni x-admin-key: es un webhook, el emisor
// no tiene sesión de usuario). `main.ts` ya crea la app con
// `{ rawBody: true }` (se usa para el webhook de PayPal) — por eso
// `req.rawBody` está disponible sin configuración adicional aquí.

import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentWebhookDto } from './dto/enrollment-webhook.dto';
import { verifyWebhookSignature } from '../common/hmac.util';

@Controller('api/lms/webhooks')
export class EnrollmentWebhookController {
  private readonly logger = new Logger(EnrollmentWebhookController.name);

  constructor(private readonly enrollmentService: EnrollmentService) {}

  // Límite más alto que el global (60/min) porque un lote de inscripciones
  // corporativas (una llamada por persona) puede llegar en ráfaga legítima,
  // pero sin quitarlo del todo: así un atacante no puede inundarlo.
  @Throttle({ global: { limit: 300, ttl: 60000 } })
  @Post('enrollment')
  @HttpCode(HttpStatus.OK)
  async handleEnrollmentWebhook(
    @Req() req: any,
    @Headers('x-webhook-timestamp') timestamp: string,
    @Headers('x-webhook-signature') signature: string,
    @Body() dto: EnrollmentWebhookDto,
  ) {
    if (!process.env.LMS_ENROLLMENT_WEBHOOK_SECRET) {
      // Falla cerrado: sin secreto configurado, no se acepta ningún webhook.
      throw new UnauthorizedException('Webhook de inscripción no configurado.');
    }

    const rawBody: Buffer | undefined = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Cuerpo crudo no disponible para verificar la firma.');
    }

    const verification = verifyWebhookSignature(
      process.env.LMS_ENROLLMENT_WEBHOOK_SECRET,
      timestamp,
      signature,
      rawBody.toString('utf8'),
    );

    if (!verification.valid) {
      this.logger.warn(`Webhook de inscripción rechazado: ${verification.reason}`);
      throw new UnauthorizedException('Firma de webhook inválida o expirada.');
    }

    if (await this.enrollmentService.wasEventAlreadyProcessed(dto.event_id)) {
      this.logger.log(`Evento ${dto.event_id} ya procesado — respuesta idempotente.`);
      return { ok: true, already_processed: true };
    }

    const result = await this.enrollmentService.enrollFromEcommerce(dto);
    await this.enrollmentService.recordWebhookEvent(dto.event_id, dto, true);

    return { ok: true, ...result };
  }
}
