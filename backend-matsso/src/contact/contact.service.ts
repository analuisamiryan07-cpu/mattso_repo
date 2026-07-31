import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  async receiveContact(dto: { nombre: string; email: string; telefono?: string; asunto?: string; mensaje?: string }) {
    const apiKey      = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'matssoecuador@gmail.com';
    const destino     = 'matssoecuador@gmail.com';

    if (!apiKey) {
      this.logger.warn('BREVO_API_KEY no configurada — contacto no enviado');
      return { success: true, message: 'Mensaje recibido.' };
    }

    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender:      { name: 'Campus Matsso — Contacto', email: senderEmail },
          to:          [{ email: destino }],
          replyTo:     { email: dto.email, name: dto.nombre },
          subject:     `[Contacto Web] ${dto.asunto ?? 'Mensaje'} — ${dto.nombre}`,
          htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;color:#1f2937;">
              <div style="background:#0A2463;padding:20px;border-radius:8px 8px 0 0;">
                <h2 style="color:#FFD700;margin:0;font-size:18px;">Nuevo mensaje de contacto</h2>
              </div>
              <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fff;">
                <table style="width:100%;font-size:14px;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#6b7280;width:30%"><strong>Nombre</strong></td><td style="padding:6px 0">${dto.nombre}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280"><strong>Correo</strong></td><td style="padding:6px 0"><a href="mailto:${dto.email}">${dto.email}</a></td></tr>
                  ${dto.telefono ? `<tr><td style="padding:6px 0;color:#6b7280"><strong>Teléfono</strong></td><td style="padding:6px 0">${dto.telefono}</td></tr>` : ''}
                  <tr><td style="padding:6px 0;color:#6b7280"><strong>Asunto</strong></td><td style="padding:6px 0">${dto.asunto ?? '—'}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
                <p style="font-size:14px;white-space:pre-wrap;">${dto.mensaje ?? ''}</p>
              </div>
            </div>`,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Contacto enviado de ${dto.email}`);
    } catch (err: any) {
      this.logger.error('Error enviando contacto: ' + (err?.response?.data?.message ?? err.message));
    }

    return { success: true, message: 'Mensaje enviado con éxito.' };
  }
}
