import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { sanitizePlainText, escapeHtml } from '../common/sanitize.util';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  async receiveContact(dtoRaw: { nombre: string; email: string; telefono?: string; asunto?: string; mensaje?: string; ciudad?: string; num_personas?: string | number }) {
    // Se sanea antes de guardar y, sobre todo, antes de interpolar en el HTML del correo.
    const dto = {
      ...dtoRaw,
      nombre: sanitizePlainText(dtoRaw.nombre),
      mensaje: sanitizePlainText(dtoRaw.mensaje),
      asunto: sanitizePlainText(dtoRaw.asunto),
      ciudad: sanitizePlainText(dtoRaw.ciudad),
    };

    const apiKey      = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'notificaciones.matsso@gmail.com';
    const destino     = process.env.CONTACT_DEST_EMAIL ?? 'matssoecuador@gmail.com';

    if (!apiKey) {
      this.logger.warn('BREVO_API_KEY no configurada — contacto no enviado');
      return { success: true, message: 'Mensaje recibido.' };
    }

    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender:      { name: 'Sapper Industries — Contacto Web', email: senderEmail },
          to:          [{ email: destino }],
          replyTo:     { email: dto.email, name: dto.nombre },
          subject:     `[Contacto Web] ${dto.asunto ?? 'Consulta'} — ${dto.nombre}`,
          htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;color:#1f2937;">
              <div style="background:#0A2463;padding:20px;border-radius:8px 8px 0 0;">
                <h2 style="color:#FFD700;margin:0;font-size:18px;">Nuevo mensaje de contacto — Sapper Industries</h2>
              </div>
              <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fff;">
                <table style="width:100%;font-size:14px;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#6b7280;width:35%"><strong>Nombre</strong></td><td style="padding:6px 0">${escapeHtml(dto.nombre)}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280"><strong>Correo</strong></td><td style="padding:6px 0"><a href="mailto:${escapeHtml(dto.email)}">${escapeHtml(dto.email)}</a></td></tr>
                  ${dto.telefono ? `<tr><td style="padding:6px 0;color:#6b7280"><strong>Teléfono</strong></td><td style="padding:6px 0">${escapeHtml(dto.telefono)}</td></tr>` : ''}
                  ${dto.ciudad ? `<tr><td style="padding:6px 0;color:#6b7280"><strong>Ciudad</strong></td><td style="padding:6px 0">${escapeHtml(dto.ciudad)}</td></tr>` : ''}
                  ${dto.num_personas ? `<tr><td style="padding:6px 0;color:#6b7280"><strong>Personas interesadas</strong></td><td style="padding:6px 0">${escapeHtml(String(dto.num_personas))}</td></tr>` : ''}
                  <tr><td style="padding:6px 0;color:#6b7280"><strong>Asunto</strong></td><td style="padding:6px 0">${escapeHtml(dto.asunto) ?? '—'}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
                <p style="font-size:14px;white-space:pre-wrap;">${escapeHtml(dto.mensaje) ?? ''}</p>
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
      // Antes esto se silenciaba y se devolvía "éxito" igual — el usuario nunca se enteraba
      // de que su mensaje no llegó. Ahora se propaga el error para que el frontend lo muestre.
      throw new InternalServerErrorException('No se pudo enviar el mensaje. Inténtalo de nuevo más tarde.');
    }

    return { success: true, message: 'Mensaje enviado con éxito.' };
  }
}
