import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaypalWebhookService } from './paypal-webhook.service';

@Controller('api/payments/paypal')
export class PaypalWebhookController {
  private readonly logger = new Logger(PaypalWebhookController.name);

  constructor(private readonly webhookService: PaypalWebhookService) {}

  // POST /api/payments/paypal/webhook
  // PayPal llama a este endpoint — NO requiere JWT
  // Necesita el body raw para verificar la firma
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const rawBody = (req as any).rawBody as string | undefined;

    if (!rawBody) {
      this.logger.warn('Webhook recibido sin rawBody — ignorado.');
      return res.status(200).json({ received: true });
    }

    const headers: Record<string, string> = {
      'paypal-transmission-id':   req.headers['paypal-transmission-id'] as string ?? '',
      'paypal-transmission-time': req.headers['paypal-transmission-time'] as string ?? '',
      'paypal-cert-url':          req.headers['paypal-cert-url'] as string ?? '',
      'paypal-auth-algo':         req.headers['paypal-auth-algo'] as string ?? '',
      'paypal-transmission-sig':  req.headers['paypal-transmission-sig'] as string ?? '',
    };

    try {
      await this.webhookService.handleWebhook(headers, rawBody);
    } catch (err: any) {
      this.logger.error('Error interno procesando webhook:', err?.message);
    }

    // Siempre responder 200 a PayPal para evitar reintentos innecesarios
    return res.status(200).json({ received: true });
  }
}
