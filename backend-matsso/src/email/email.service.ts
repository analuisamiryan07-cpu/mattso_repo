import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromEmail: string;
  private readonly company = 'MATSSO Ecuador';

  constructor() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    this.fromEmail = user ? `"${this.company}" <${user}>` : '';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
      this.logger.warn('GMAIL_USER / GMAIL_APP_PASSWORD no configurados — emails desactivados');
    }
  }

  async sendOrderConfirmation(data: {
    to: string;
    nombre: string;
    orderId: number;
    total: number;
    items: Array<{ producto: string; precio: number }>;
  }) {
    if (!this.transporter) return;

    const rows = data.items
      .map(
        (i) => `<tr>
          <td style="padding:8px 4px;border-bottom:1px solid #e5e7eb;">${i.producto}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #e5e7eb;text-align:right;">$${i.precio.toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    await this.send({
      to: data.to,
      subject: `Orden #${data.orderId} recibida — ${this.company}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
          <div style="background:#0A2463;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#FFD700;margin:0;font-size:20px;">${this.company}</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">Certificaciones de Competencias Laborales</p>
          </div>
          <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
            <h2 style="color:#0A2463;margin-top:0;">¡Hola, ${data.nombre}!</h2>
            <p>Hemos recibido tu orden. Verificaremos tu comprobante de pago en las próximas <strong>24 horas hábiles</strong>.</p>
            <div style="background:#f9fafb;border-radius:6px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 10px;font-weight:700;color:#0A2463;font-size:14px;">Resumen — Orden #${data.orderId}</p>
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                ${rows}
                <tr>
                  <td style="padding:10px 4px 0;font-weight:700;">Total con IVA</td>
                  <td style="padding:10px 4px 0;text-align:right;font-weight:700;color:#0A2463;">$${data.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            <p style="font-size:13px;color:#6b7280;">Si tienes dudas escríbenos a <a href="mailto:info@matsso.ec" style="color:#0A2463;">info@matsso.ec</a></p>
          </div>
        </div>`,
    });
  }

  async sendPaymentApproved(data: {
    to: string;
    nombre: string;
    orderId: number;
    items: Array<{ producto: string }>;
  }) {
    if (!this.transporter) return;

    const certs = data.items.map((i) => `<li style="margin:4px 0;">${i.producto}</li>`).join('');

    await this.send({
      to: data.to,
      subject: `¡Pago aprobado! Orden #${data.orderId} — ${this.company}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
          <div style="background:#0A2463;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#FFD700;margin:0;font-size:20px;">${this.company}</h1>
          </div>
          <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
            <div style="text-align:center;margin-bottom:20px;">
              <div style="background:#22c55e;color:#fff;border-radius:50%;width:56px;height:56px;display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;">✓</div>
            </div>
            <h2 style="color:#0A2463;text-align:center;margin-top:0;">¡Tu pago fue aprobado!</h2>
            <p>Hola <strong>${data.nombre}</strong>, tu pago para la orden <strong>#${data.orderId}</strong> ha sido verificado y aprobado.</p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 8px;font-weight:700;color:#166534;font-size:13px;">Certificaciones aprobadas:</p>
              <ul style="margin:0;padding-left:18px;color:#166534;font-size:13px;">${certs}</ul>
            </div>
            <p>Nos pondremos en contacto contigo para coordinar el proceso de evaluación.</p>
            <p style="font-size:13px;color:#6b7280;">Contacto: <a href="mailto:info@matsso.ec" style="color:#0A2463;">info@matsso.ec</a></p>
          </div>
        </div>`,
    });
  }

  async sendPaymentRejected(data: {
    to: string;
    nombre: string;
    orderId: number;
  }) {
    if (!this.transporter) return;

    await this.send({
      to: data.to,
      subject: `Comprobante no verificado — Orden #${data.orderId} — ${this.company}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
          <div style="background:#0A2463;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#FFD700;margin:0;font-size:20px;">${this.company}</h1>
          </div>
          <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
            <h2 style="color:#0A2463;margin-top:0;">Hola, ${data.nombre}</h2>
            <p>No pudimos verificar el comprobante de tu orden <strong>#${data.orderId}</strong>.</p>
            <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:14px;margin:20px 0;font-size:13px;color:#991b1b;">
              Posibles causas: imagen ilegible, monto incorrecto o comprobante inválido.
            </div>
            <p>Contáctanos para resolver el inconveniente:</p>
            <ul style="font-size:13px;">
              <li>Email: <a href="mailto:info@matsso.ec" style="color:#0A2463;">info@matsso.ec</a></li>
            </ul>
            <p style="font-size:12px;color:#9ca3af;">Referencia: Orden #${data.orderId}</p>
          </div>
        </div>`,
    });
  }

  private async send(payload: { to: string; subject: string; html: string }) {
    try {
      await this.transporter!.sendMail({
        from: this.fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
    } catch (err) {
      this.logger.error(`Error enviando email a ${payload.to}: ${(err as Error).message}`);
    }
  }
}
