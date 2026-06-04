import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('api/contacto')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async receiveContact(@Body() body: { nombre: string; email: string; telefono?: string; mensaje?: string }) {
    return this.contactService.receiveContact(body);
  }
}
