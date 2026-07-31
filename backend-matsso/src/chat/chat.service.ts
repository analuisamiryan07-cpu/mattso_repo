import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ChatButton { label: string; url: string; }
export interface ChatResponse { response: string; buttons: ChatButton[]; }

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly certibotUrl = process.env.CERTIBOT_URL?.replace(/\/$/, '');
  private readonly certibotKey = process.env.CERTIBOT_API_KEY ?? '';

  async processMessage(userMessage: string): Promise<ChatResponse> {
    if (!this.certibotUrl) {
      this.logger.error('CERTIBOT_URL no definida');
      return { response: 'El servicio de chat no está disponible en este momento.', buttons: [] };
    }

    try {
      const { data } = await axios.post<{ respuesta: string; buttons?: { label: string; url: string }[] }>(
        `${this.certibotUrl}/chat`,
        { texto: userMessage },
        {
          headers: { 'x-api-key': this.certibotKey },
          timeout: 10_000,
        },
      );
      return { response: data.respuesta ?? 'No obtuve respuesta.', buttons: data.buttons ?? [] };
    } catch (err) {
      this.logger.error('Error llamando a CertiBot: ' + (err as Error).message);
      return { response: 'El asistente no está disponible ahora mismo. Por favor intenta más tarde.', buttons: [] };
    }
  }
}
