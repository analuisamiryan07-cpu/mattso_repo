import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() dto: SendMessageDto) {
    const botResponse = await this.chatService.processMessage(dto.message);
    return botResponse;
  }
}
