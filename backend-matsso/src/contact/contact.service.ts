import { Injectable } from '@nestjs/common';

@Injectable()
export class ContactService {
  async receiveContact(dto: { nombre: string; email: string; telefono?: string; mensaje?: string }) {
    console.log('[CONTACTO] Nuevo mensaje recibido:', dto);
    return { success: true, message: 'Mensaje de contacto recibido con éxito.' };
  }
}
