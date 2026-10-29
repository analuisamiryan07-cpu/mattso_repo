import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ChatButton { label: string; url: string; type?: string; precio?: string; modalidad?: string; }
export interface ChatResponse { response: string; buttons: ChatButton[]; }

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly certibotUrl = process.env.CERTIBOT_URL?.replace(/\/$/, '');
  private readonly certibotKey = process.env.CERTIBOT_API_KEY ?? '';

  // `sesion` solo se reenvía a CertiBot; no se guarda ni se escribe en los registros.
  async processMessage(userMessage: string, sesion?: string): Promise<ChatResponse> {
    if (!this.certibotUrl) {
      this.logger.error('CERTIBOT_URL no definida');
      return { response: 'El servicio de chat no está disponible en este momento.', buttons: [] };
    }

    try {
      const { data } = await axios.post<{ respuesta: string; buttons?: { label: string; url: string }[] }>(
        `${this.certibotUrl}/chat`,
        { texto: userMessage, ...(sesion && { sesion }) },
        {
          headers: { 'x-api-key': this.certibotKey },
          timeout: 10_000,
          maxRedirects: 0,
          maxContentLength: 64 * 1024,
        },
      );
      // Solo se reenvían enlaces http(s) o rutas internas: evita `javascript:` u otros
      // esquemas peligrosos si el servicio del bot llegara a ser comprometido.
      const buttons = (Array.isArray(data?.buttons) ? data.buttons : [])
        .filter((b) => b && typeof b.label === 'string' && typeof b.url === 'string')
        .filter((b) => /^(https?:\/\/|\/(?!\/))/i.test(b.url))
        .slice(0, 12)
        .map((b: any) => ({
          label: b.label.slice(0, 120),
          url: b.url.slice(0, 500),
          ...(b.type === 'item' ? { type: 'item' } : {}),
          ...(b.precio != null ? { precio: String(b.precio).slice(0, 20) } : {}),
          ...(b.modalidad != null ? { modalidad: String(b.modalidad).slice(0, 40) } : {}),
        }));
      const response = typeof data?.respuesta === 'string' ? data.respuesta.slice(0, 2000) : 'No obtuve respuesta.';
      return { response, buttons };
    } catch (err) {
      this.logger.error('Error llamando a CertiBot: ' + (err as Error).message);
      return { response: 'El asistente no está disponible ahora mismo. Por favor intenta más tarde.', buttons: [] };
    }
  }
}
