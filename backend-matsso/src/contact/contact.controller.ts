import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/contacto')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // El frontend ya exige sesión para mostrar este formulario — se hace cumplir
  // también en el backend para que no sea solo una restricción de interfaz.
  @UseGuards(JwtAuthGuard)
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post()
  async receiveContact(@Body() dto: CreateContactDto) {
    return this.contactService.receiveContact(dto);
  }
}
