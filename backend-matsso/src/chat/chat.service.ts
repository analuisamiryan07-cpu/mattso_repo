import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Clasificador de intenciones basado en keywords.
 * Sin dependencias externas — funciona como un árbol de decisión simple.
 */
interface IntentRule {
  intent: string;
  keywords: string[];
  weight: number; // Prioridad cuando múltiples intenciones coinciden
}

@Injectable()
export class ChatService {
  private rules: IntentRule[] = [
    { intent: 'saludo',        keywords: ['hola', 'buenos', 'saludos', 'hey', 'buen dia', 'buenas'],     weight: 1 },
    { intent: 'precio',        keywords: ['precio', 'cuesta', 'vale', 'valor', 'costo', 'cuanto'],       weight: 3 },
    { intent: 'matricula',     keywords: ['inscri', 'matric', 'comprar', 'pago', 'pagar', 'registr'],     weight: 3 },
    { intent: 'certificacion', keywords: ['certific', 'certificado', 'certificacion'],                    weight: 4 },
    { intent: 'capacitacion',  keywords: ['capacita', 'curso', 'formacion', 'taller'],                    weight: 3 },
    { intent: 'recomendacion', keywords: ['recomien', 'mejor', 'sugier', 'cual elijo', 'que me'],         weight: 2 },
    { intent: 'horario',       keywords: ['horario', 'hora', 'cuando', 'fecha', 'duracion'],              weight: 2 },
    { intent: 'contacto',      keywords: ['contacto', 'telefono', 'correo', 'email', 'llamar', 'whatsapp'], weight: 2 },
    { intent: 'ocio',          keywords: ['nombre', 'llamas', 'quien eres', 'que haces', 'eres'],         weight: 1 },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clasifica un mensaje y retorna una respuesta.
   * Opcionalmente consulta la DB para datos dinámicos.
   */
  async processMessage(userMessage: string): Promise<string> {
    const input = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const intent = this.classify(input);

    switch (intent) {
      case 'saludo':
        return '¡Hola! Soy Juan 🦫, el ingeniero castor de MATTSO. ¿En qué te puedo ayudar hoy?';

      case 'precio':
        return 'Los costos varían según el programa. Las capacitaciones arrancan desde $75 y las certificaciones desde $120. Visita el catálogo para ver precios exactos.';

      case 'matricula':
        return '¡Matricularse es fácil! Solo ve al catálogo, elige el curso que te gusta, dale clic a "Añadir al carrito" y luego sigue los pasos de pago.';

      case 'certificacion':
        return await this.getCertificacionesResponse();

      case 'capacitacion':
        return await this.getCapacitacionesResponse();

      case 'recomendacion':
        return 'Si trabajas en áreas de alto riesgo, te recomiendo nuestras certificaciones en Prevención de Riesgos Laborales. Para roles administrativos, la Formación de Formadores es excelente. ¡Visita el catálogo para explorar!';

      case 'horario':
        return 'Las capacitaciones virtuales son flexibles — estudia a tu ritmo. Las evaluaciones presenciales tienen fechas específicas que puedes consultar en el catálogo.';

      case 'contacto':
        return 'Puedes contactarnos desde la página de Contacto, o escríbenos a info@campusmatsso.com. ¡Estaremos encantados de atenderte!';

      case 'ocio':
        return 'Soy Juan el Castor 🦫, ingeniero de seguridad de MATTSO. Mi trabajo es construir conocimiento (¡y presas!). Estoy aquí para guiarte.';

      default:
        return 'Es una pregunta muy interesante. Aún estoy aprendiendo, ¿te gustaría que te contacte un asesor humano? Puedes ir a la página de Contacto.';
    }
  }

  private classify(input: string): string {
    let bestIntent = 'desconocido';
    let bestScore = 0;

    for (const rule of this.rules) {
      const matches = rule.keywords.filter((kw) => input.includes(kw)).length;
      const score = matches * rule.weight;
      if (score > bestScore) {
        bestScore = score;
        bestIntent = rule.intent;
      }
    }

    return bestIntent;
  }

  private async getCertificacionesResponse(): Promise<string> {
    try {
      const productos = await this.prisma.producto.findMany({
        where: { tipo: 'CERTIFICACION', activo: true },
        select: { titulo: true, precio: true },
        take: 5,
      });

      if (productos.length > 0) {
        const lista = productos.map((p) => `• ${p.titulo} — $${p.precio}`).join('\n');
        return `Tenemos estas certificaciones disponibles:\n${lista}\n\n¡Revisa la sección "Certificaciones" para más detalles!`;
      }
    } catch {
      // DB no disponible, respuesta genérica
    }

    return 'Tenemos certificaciones avaladas por el Ministerio de Trabajo en áreas de seguridad industrial, salud ocupacional y más. Visita la sección "Certificaciones" para ver todas las opciones.';
  }

  private async getCapacitacionesResponse(): Promise<string> {
    try {
      const productos = await this.prisma.producto.findMany({
        where: { tipo: 'CAPACITACION', activo: true },
        select: { titulo: true, precio: true },
        take: 5,
      });

      if (productos.length > 0) {
        const lista = productos.map((p) => `• ${p.titulo} — $${p.precio}`).join('\n');
        return `Estas son nuestras capacitaciones:\n${lista}\n\n¡Ve a "Capacitaciones" para inscribirte!`;
      }
    } catch {
      // DB no disponible
    }

    return 'Ofrecemos capacitaciones en Seguridad Industrial, Salud Ocupacional, Formación de Formadores y más. Visita "Capacitaciones" para ver el catálogo completo.';
  }
}
