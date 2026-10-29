import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Público: 20 mensajes/min por IP para que no se use el bot para agotar recursos.
  @Throttle({ global: { limit: 20, ttl: 60000 } })
  @Post()
  @HttpCode(200)
  async sendMessage(@Body() dto: SendMessageDto) {
    const botResponse = await this.chatService.processMessage(dto.message, dto.sesion);
    return botResponse;
  }
}
