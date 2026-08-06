import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | null;
  private readonly senderEmail: string;
  private readonly senderName = 'Sapper Industries';

  constructor() {
    this.apiKey    = process.env.BREVO_API_KEY ?? null;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'info@sapper-industries.com';

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
              <a href="mailto:info@sapper-industries.com" style="color:#0A2463;">info@sapper-industries.com</a>
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
              <a href="mailto:info@sapper-industries.com" style="color:#0A2463;">info@sapper-industries.com</a>
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
              <li>Email: <a href="mailto:info@sapper-industries.com" style="color:#0A2463;">info@sapper-industries.com</a></li>
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

  async sendPaymentApprovedWithPdf(data: {
    to: string;
    nombre: string;
    orderId: number;
    total: number;
    subtotal: number;
    iva: number;
    items: Array<{ producto: string; cantidad: number; precio: number }>;
    cedula?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    ciudad?: string;
  }) {
    const pdfBuffer = await this.generateReceiptPdf(data);
    const rows = data.items
      .map(
        (i) => `<tr>
          <td style="padding:6px 0;font-size:14px;border-bottom:1px solid #e5e7eb;">
            ${i.producto} × ${i.cantidad}
          </td>
          <td style="padding:6px 0;font-size:14px;border-bottom:1px solid #e5e7eb;text-align:right;">
            $${(i.precio * i.cantidad).toFixed(2)}
          </td>
        </tr>`,
      )
      .join('');

    const ivaRow = data.iva > 0
      ? `<tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">Subtotal</td>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;text-align:right;">$${data.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">IVA 15% (capacitaciones)</td>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;text-align:right;">$${data.iva.toFixed(2)}</td>
        </tr>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;color:#1f2937;font-size:15px;margin:0;padding:0;background:#f9fafb;">
        <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
          <div style="background:#0f2a5c;padding:32px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:.02em;">IN SAPPER Industries</h1>
            <p style="color:rgba(255,255,255,.7);margin:6px 0 0;font-size:13px;">Conocimiento · Calidad · Confianza</p>
          </div>
          <div style="padding:32px 40px;">
            <p style="font-size:17px;font-weight:700;color:#0f2a5c;margin-bottom:12px;">Hola, ${data.nombre} 👋</p>
            <span style="display:inline-block;background:#dcfce7;color:#166534;border-radius:20px;padding:5px 14px;font-size:13px;font-weight:700;margin-bottom:20px;">✅ Inscripción confirmada</span>
            <p style="line-height:1.7;color:#374151;margin:0 0 14px;">
              Nos complace informarte que tu pago ha sido <strong>aprobado exitosamente</strong>.
              Tu inscripción está confirmada y ya formas parte de IN SAPPER Industries.
            </p>
            <div style="background:#f0f4ff;border-left:4px solid #2458b3;border-radius:6px;padding:16px 20px;margin:20px 0;">
              <strong style="display:block;color:#0f2a5c;margin-bottom:6px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;">
                Detalle de tu orden #${data.orderId}
              </strong>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr>
                    <th style="text-align:left;font-size:12px;color:#6b7280;padding:4px 0;border-bottom:1px solid #d1d5db;">Producto / Servicio</th>
                    <th style="text-align:right;font-size:12px;color:#6b7280;padding:4px 0;border-bottom:1px solid #d1d5db;">Precio</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                  <tr><td colspan="2" style="border-top:1px solid #d1d5db;padding-top:6px;"></td></tr>
                  ${ivaRow}
                  <tr>
                    <td style="font-weight:700;color:#0f2a5c;padding-top:6px;">TOTAL</td>
                    <td style="font-weight:700;color:#0f2a5c;padding-top:6px;text-align:right;">$${data.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p style="line-height:1.7;color:#374151;margin:0 0 14px;">
              Adjunto a este correo encontrarás tu <strong>comprobante de pago en PDF</strong>
              con el detalle completo de tu inscripción. Guárdalo como respaldo.
            </p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px;">
              Atentamente,<br>
              <strong style="color:#0f2a5c">Equipo IN SAPPER Industries</strong>
            </p>
          </div>
          <div style="background:#f3f4f6;padding:18px 40px;text-align:center;font-size:12px;color:#9ca3af;">
            Este correo fue generado automáticamente.<br>
            &copy; ${new Date().getFullYear()} IN SAPPER Industries — Soluciones que generan futuro.
          </div>
        </div>
      </div>`;

    if (!this.apiKey) return;
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender:      { name: 'IN SAPPER Industries', email: this.senderEmail },
          to:          [{ email: data.to }],
          subject:     `Comprobante de pago — Orden #${data.orderId} — IN SAPPER Industries`,
          htmlContent: html,
          attachment:  [{ content: pdfBuffer.toString('base64'), name: 'Comprobante_Inscripcion.pdf' }],
        },
        { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } },
      );
    } catch (err: any) {
      this.logger.error(`Error enviando email con PDF a ${data.to}: ${err?.response?.data?.message ?? err.message}`);
    }
  }

  private async generateReceiptPdf(data: {
    orderId: number;
    nombre: string;
    total: number;
    subtotal: number;
    iva: number;
    items: Array<{ producto: string; cantidad: number; precio: number }>;
    cedula?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    ciudad?: string;
  }): Promise<Buffer> {
    let logoBuffer: Buffer | null = null;
    try {
      const res = await axios.get(
        'https://res.cloudinary.com/ehglt8h8/image/upload/v1784925646/Logo_1.png',
        { responseType: 'arraybuffer' },
      );
      logoBuffer = Buffer.from(res.data as ArrayBuffer);
    } catch { /* logo opcional, el PDF continúa sin él */ }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Comprobante #${data.orderId}` } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const NAVY  = '#0f2a5c';
      const BLUE  = '#2458b3';
      const GRAY  = '#6b7280';
      const L     = 40;
      const R     = 555;
      const W     = R - L;
      const folio = String(data.orderId).padStart(6, '0');
      const now   = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil', hour12: false });

      // ── HEADER ──────────────────────────────────────────────
      if (logoBuffer) {
        doc.image(logoBuffer, L, 35, { fit: [120, 55] });
      } else {
        doc.fontSize(17).fillColor(NAVY).font('Helvetica-Bold').text('IN SAPPER INDUSTRIES', L, 45);
      }
      doc.fontSize(14).fillColor(NAVY).font('Helvetica-Bold').text('COMPROBANTE DE PAGO', L, 42, { align: 'right' });
      doc.fontSize(11).fillColor(BLUE).font('Helvetica').text(`N° REC-${folio}`, L, 60, { align: 'right' });
      doc.fontSize(9).fillColor(GRAY).text(`Emisión: ${now}`, L, 76, { align: 'right' });

      const lineY = 100;
      doc.moveTo(L, lineY).lineTo(R, lineY).strokeColor(NAVY).lineWidth(2).stroke();

      // ── SECCIÓN CLIENTE ──────────────────────────────────────
      let y = 115;
      doc.rect(L, y, W, 18).fill(NAVY);
      doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold')
         .text('DATOS DEL CLIENTE', L + 10, y + 5);
      y += 18;

      doc.rect(L, y, W, 90).strokeColor('#d1d5db').lineWidth(1).stroke();
      y += 10;

      const col1 = L + 10;
      const col2 = L + W / 2 + 10;

      const field = (label: string, value: string, x: number, cy: number) => {
        doc.fontSize(8).fillColor(GRAY).font('Helvetica').text(label.toUpperCase(), x, cy);
        doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text(value || '—', x, cy + 10);
      };

      field('Nombres completos', data.nombre, col1, y);
      field('Correo electrónico', data.correo ?? '—', col2, y);
      y += 28;
      field('Cédula / RUC', data.cedula ?? '—', col1, y);
      field('Dirección', [data.direccion, data.ciudad].filter(Boolean).join(', ') || '—', col2, y);
      y += 28;
      field('Teléfono', data.telefono ?? '—', col1, y);
      field('N° Orden', `#${data.orderId}`, col2, y);

      y = 230;

      // ── SECCIÓN ITEMS ────────────────────────────────────────
      doc.rect(L, y, W, 18).fill(NAVY);
      doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold')
         .text('DETALLE DE LA INSCRIPCIÓN', L + 10, y + 5);
      y += 18;

      // Cabecera tabla
      doc.rect(L, y, W, 18).fill('#f3f4f6');
      doc.fontSize(9).fillColor('#374151').font('Helvetica-Bold');
      doc.text('PRODUCTO / SERVICIO', L + 10, y + 5);
      doc.text('CANT.', L + W * 0.58, y + 5);
      doc.text('P. UNIT.', L + W * 0.72, y + 5);
      doc.text('SUBTOTAL', L + W * 0.86, y + 5);
      y += 18;

      doc.font('Helvetica').fontSize(10).fillColor('#111827');
      for (const item of data.items) {
        const sub = (item.precio * item.cantidad).toFixed(2);
        doc.text(item.producto, L + 10, y + 3, { width: W * 0.55 });
        doc.text(String(item.cantidad), L + W * 0.58, y + 3);
        doc.text(`$${item.precio.toFixed(2)}`, L + W * 0.72, y + 3);
        doc.text(`$${sub}`, L + W * 0.86, y + 3);
        y += 22;
        doc.moveTo(L, y).lineTo(R, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      }

      y += 14;

      // ── TOTALES + SELLO ──────────────────────────────────────
      const subtotal = data.subtotal;
      const iva      = data.iva;
      const totX     = L + W * 0.55;
      const totW     = W * 0.45;

      doc.rect(L, y, W * 0.5, 50).strokeColor('#16a34a').lineWidth(1.5).stroke();
      doc.fontSize(12).fillColor('#16a34a').font('Helvetica-Bold')
         .text('✔  PAGO CONFIRMADO', L + 12, y + 8);
      doc.fontSize(8).fillColor(GRAY).font('Helvetica')
         .text('Forma de pago: PayPal', L + 12, y + 25)
         .text('Este documento es válido como comprobante.', L + 12, y + 36);

      doc.fontSize(10).fillColor(GRAY).font('Helvetica');
      doc.text('Subtotal (sin IVA)', totX, y, { width: totW * 0.6 });
      doc.text(`$${subtotal.toFixed(2)}`, totX + totW * 0.6, y, { width: totW * 0.4, align: 'right' });
      doc.text('IVA 15%', totX, y + 15, { width: totW * 0.6 });
      doc.text(`$${iva.toFixed(2)}`, totX + totW * 0.6, y + 15, { width: totW * 0.4, align: 'right' });

      doc.moveTo(totX, y + 32).lineTo(R, y + 32).strokeColor(NAVY).lineWidth(1.5).stroke();
      doc.fontSize(13).fillColor(NAVY).font('Helvetica-Bold');
      doc.text('TOTAL', totX, y + 36, { width: totW * 0.6 });
      doc.text(`$${data.total.toFixed(2)}`, totX + totW * 0.6, y + 36, { width: totW * 0.4, align: 'right' });

      y += 75;

      // ── FOOTER ───────────────────────────────────────────────
      doc.moveTo(L, y).lineTo(R, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      y += 10;
      doc.fontSize(9).fillColor(NAVY).font('Helvetica-Bold')
         .text('IN SAPPER Industries', L, y, { align: 'center' });
      doc.fontSize(8).fillColor(GRAY).font('Helvetica')
         .text('Conocimiento · Calidad · Confianza', L, y + 12, { align: 'center' })
         .text('Este comprobante fue generado electrónicamente y no requiere firma física.', L, y + 24, { align: 'center' });

      doc.end();
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
