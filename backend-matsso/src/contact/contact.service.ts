import { Injectable } from '@nestjs/common';

@Injectable()
export class ContactService {
  async receiveContact(dto: { nombre: string; email: string; telefono?: string; mensaje?: string }) {
    // FIX [Active Debug Code]: Eliminado console.log que expone datos personales (PII)
    return { success: true, message: 'Mensaje de contacto recibido con éxito.' };
  }
}
