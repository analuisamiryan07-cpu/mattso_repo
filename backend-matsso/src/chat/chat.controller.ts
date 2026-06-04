import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body('message') message: string) {
    if (!message) {
      return { response: 'Por favor, envíame un mensaje válido.' };
    }
    
    const botResponse = await this.chatService.processMessage(message);
    return { response: botResponse };
  }
}
