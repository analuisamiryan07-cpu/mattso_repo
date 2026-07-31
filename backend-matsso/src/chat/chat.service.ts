import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly certibotUrl = process.env.CERTIBOT_URL?.replace(/\/$/, '');
  private readonly certibotKey = process.env.CERTIBOT_API_KEY ?? '';

  async processMessage(userMessage: string): Promise<string> {
    if (!this.certibotUrl) {
      this.logger.error('CERTIBOT_URL no definida');
      return 'El servicio de chat no está disponible en este momento. Contáctanos en la página de Contacto.';
    }

    try {
      const { data } = await axios.post<{ respuesta: string }>(
        `${this.certibotUrl}/chat`,
        { texto: userMessage },
        {
          headers: { 'x-api-key': this.certibotKey },
          timeout: 10_000,
        },
      );
      return data.respuesta ?? 'No obtuve respuesta del asistente.';
    } catch (err) {
      this.logger.error('Error llamando a CertiBot: ' + (err as Error).message);
      return 'El asistente no está disponible ahora mismo. Por favor intenta más tarde o contáctanos directamente.';
    }
  }
}
