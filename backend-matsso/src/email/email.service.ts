import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | null;
  private readonly senderEmail: string;
  private readonly senderName = 'MATSSO Ecuador';

  constructor() {
    this.apiKey    = process.env.BREVO_API_KEY ?? null;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'matssoecuador@gmail.com';

    if (this.apiKey) {
      this.logger.log(`Brevo configurado — sender: ${this.senderEmail}`);
    } else {
      this.logger.warn('BREVO_API_KEY no configurada — emails desactivados');
    }
  }

  async sendOrderConfirmation(data: {
    to: string;
    nombre: string;
    orderId: number;
    total: number;
    iva?: number;
    items: Array<{ producto: string; precio: number }>;
  }) {
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
      subject: `Orden #${data.orderId} recibida — ${this.senderName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
          <div style="background:#0A2463;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#FFD700;margin:0;font-size:20px;">${this.senderName}</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">Certificaciones de Competencias Laborales</p>
          </div>
          <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
            <h2 style="color:#0A2463;margin-top:0;">¡Hola, ${data.nombre}!</h2>
            <p>Hemos recibido tu orden y tu comprobante de pago. Lo verificaremos en las próximas <strong>24 horas hábiles</strong>.</p>
            <div style="background:#f9fafb;border-radius:6px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 10px;font-weight:700;color:#0A2463;font-size:14px;">Resumen — Orden #${data.orderId}</p>
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                ${rows}
                <tr>
                  <td style="padding:10px 4px 0;font-weight:700;">${(data.iva ?? 0) > 0 ? 'Total con IVA (15%)' : 'Total'}</td>
                  <td style="padding:10px 4px 0;text-align:right;font-weight:700;color:#0A2463;">$${data.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            <p style="font-size:13px;color:#6b7280;">
              ¿Tienes dudas? Escríbenos a
              <a href="mailto:matssoecuador@gmail.com" style="color:#0A2463;">matssoecuador@gmail.com</a>
              o al WhatsApp <a href="https://wa.me/593983555081" style="color:#0A2463;">+593 98 355 5081</a>.
            </p>
          </div>
        </div>`,
    });
  }

  async sendPaymentApproved(data: {
    to: string;
    nombre: string;
    orderId: number;
    items: Array<{ producto: string }>;
    cedula?: string;
    telefono?: string;
    direccion?: string;
  }) {
    const certs = data.items.map((i) => `<li style="margin:4px 0;">${i.producto}</li>`).join('');

    const datosPersonales = `
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 10px;font-weight:700;color:#0A2463;font-size:13px;">Datos del Participante</p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#6b7280;width:40%;">Nombre completo</td><td style="padding:4px 0;font-weight:600;">${data.nombre}</td></tr>
          ${data.cedula ? `<tr><td style="padding:4px 0;color:#6b7280;">Cédula / RUC</td><td style="padding:4px 0;font-weight:600;">${data.cedula}</td></tr>` : ''}
          ${data.telefono ? `<tr><td style="padding:4px 0;color:#6b7280;">Teléfono</td><td style="padding:4px 0;font-weight:600;">${data.telefono}</td></tr>` : ''}
          ${data.direccion ? `<tr><td style="padding:4px 0;color:#6b7280;">Dirección</td><td style="padding:4px 0;font-weight:600;">${data.direccion}</td></tr>` : ''}
        </table>
      </div>`;

    await this.send({
      to: data.to,
      subject: `¡Pago aprobado! Orden #${data.orderId} — ${this.senderName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
          <div style="background:#0A2463;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#FFD700;margin:0;font-size:20px;">${this.senderName}</h1>
          </div>
          <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
            <div style="text-align:center;margin-bottom:20px;">
              <div style="background:#22c55e;color:#fff;border-radius:50%;width:56px;height:56px;display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;">✓</div>
            </div>
            <h2 style="color:#0A2463;text-align:center;margin-top:0;">¡Tu pago fue aprobado!</h2>
            <p>Hola <strong>${data.nombre}</strong>, tu pago para la orden <strong>#${data.orderId}</strong> ha sido verificado y aprobado.</p>
            ${datosPersonales}
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 8px;font-weight:700;color:#166534;font-size:13px;">Certificaciones aprobadas:</p>
              <ul style="margin:0;padding-left:18px;color:#166534;font-size:13px;">${certs}</ul>
            </div>
            <p>Nos pondremos en contacto contigo pronto para coordinar el proceso de evaluación.</p>
            <p style="font-size:13px;color:#6b7280;">
              Contacto:
              <a href="mailto:matssoecuador@gmail.com" style="color:#0A2463;">matssoecuador@gmail.com</a>
              · WhatsApp <a href="https://wa.me/593983555081" style="color:#0A2463;">+593 98 355 5081</a>
            </p>
          </div>
        </div>`,
    });
  }

  async sendPaymentRejected(data: {
    to: string;
    nombre: string;
    orderId: number;
    motivo?: string;
  }) {
    const motivoHtml = data.motivo
      ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:14px;margin:20px 0;font-size:13px;color:#991b1b;">
           <strong>Motivo:</strong> ${data.motivo}
         </div>`
      : `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:14px;margin:20px 0;font-size:13px;color:#991b1b;">
           Posibles causas: imagen ilegible, monto incorrecto o comprobante inválido.
         </div>`;

    await this.send({
      to: data.to,
      subject: `Comprobante no verificado — Orden #${data.orderId} — ${this.senderName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
          <div style="background:#0A2463;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#FFD700;margin:0;font-size:20px;">${this.senderName}</h1>
          </div>
          <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
            <h2 style="color:#0A2463;margin-top:0;">Hola, ${data.nombre}</h2>
            <p>No pudimos verificar el comprobante de tu orden <strong>#${data.orderId}</strong>.</p>
            ${motivoHtml}
            <p>Contáctanos para resolver el inconveniente y volver a intentarlo:</p>
            <ul style="font-size:13px;">
              <li>Email: <a href="mailto:matssoecuador@gmail.com" style="color:#0A2463;">matssoecuador@gmail.com</a></li>
              <li>WhatsApp: <a href="https://wa.me/593983555081" style="color:#0A2463;">+593 98 355 5081</a></li>
            </ul>
            <p style="font-size:12px;color:#9ca3af;">Referencia: Orden #${data.orderId}</p>
          </div>
        </div>`,
    });
  }

  async sendPasswordReset(data: { to: string; nombre: string; resetUrl: string }) {
    await this.send({
      to: data.to,
      subject: `Recuperación de contraseña — ${this.senderName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
          <div style="background:#0A2463;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#FFD700;margin:0;font-size:20px;">${this.senderName}</h1>
          </div>
          <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
            <h2 style="color:#0A2463;margin-top:0;">Hola, ${data.nombre}</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón para crear una nueva:</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${data.resetUrl}"
                 style="background:#0A2463;color:#FFD700;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;text-decoration:none;display:inline-block;">
                Restablecer contraseña
              </a>
            </div>
            <p style="font-size:13px;color:#6b7280;">
              Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo — tu cuenta sigue segura.
            </p>
            <p style="font-size:12px;color:#9ca3af;word-break:break-all;">
              Si el botón no funciona, copia este enlace en tu navegador:<br>${data.resetUrl}
            </p>
          </div>
        </div>`,
    });
  }

  private async send(payload: { to: string; subject: string; html: string }) {
    if (!this.apiKey) return;

    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: payload.html,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`Error enviando email a ${payload.to}: ${msg}`);
    }
  }
}
