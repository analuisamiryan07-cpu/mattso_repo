import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class PaypalApiService {
  private readonly logger = new Logger(PaypalApiService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    const mode = process.env.PAYPAL_MODE ?? 'sandbox';
    this.baseUrl =
      mode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
    this.clientId     = process.env.PAYPAL_CLIENT_ID     ?? '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? '';

    this.http = axios.create({ baseURL: this.baseUrl });
  }

  async getAccessToken(): Promise<string> {
    try {
      const response = await this.http.post(
        '/v1/oauth2/token',
        'grant_type=client_credentials',
        {
          auth: { username: this.clientId, password: this.clientSecret },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );
      return response.data.access_token as string;
    } catch (err: any) {
      this.logger.error('Error obteniendo token PayPal', err?.response?.data);
      throw new InternalServerErrorException('No se pudo autenticar con PayPal.');
    }
  }

  async createOrder(
    token: string,
    internalOrderId: string,
    amount: string,
    currency: string,
    idempotencyKey: string,
  ): Promise<{ id: string }> {
    try {
      const response = await this.http.post(
        '/v2/checkout/orders',
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              custom_id: internalOrderId,
              amount: { currency_code: currency, value: amount },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': idempotencyKey,
          },
        },
      );
      return { id: response.data.id };
    } catch (err: any) {
      this.logger.error('Error creando orden en PayPal', err?.response?.data);
      throw new InternalServerErrorException('No se pudo crear la orden en PayPal.');
    }
  }

  async captureOrder(token: string, paypalOrderId: string): Promise<any> {
    try {
      const response = await this.http.post(
        `/v2/checkout/orders/${paypalOrderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `capture-${paypalOrderId}`,
          },
        },
      );
      return response.data;
    } catch (err: any) {
      this.logger.error('Error capturando orden PayPal', err?.response?.data);
      throw new InternalServerErrorException('No se pudo capturar el pago en PayPal.');
    }
  }

  async verifyWebhookSignature(token: string, headers: Record<string, string>, rawBody: string): Promise<boolean> {
    try {
      const response = await this.http.post(
        '/v1/notifications/verify-webhook-signature',
        {
          transmission_id:   headers['paypal-transmission-id'],
          transmission_time: headers['paypal-transmission-time'],
          cert_url:          headers['paypal-cert-url'],
          auth_algo:         headers['paypal-auth-algo'],
          transmission_sig:  headers['paypal-transmission-sig'],
          webhook_id:        process.env.PAYPAL_WEBHOOK_ID,
          webhook_event:     JSON.parse(rawBody),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.verification_status === 'SUCCESS';
    } catch (err: any) {
      this.logger.error('Error verificando webhook PayPal', err?.response?.data);
      return false;
    }
  }
}
