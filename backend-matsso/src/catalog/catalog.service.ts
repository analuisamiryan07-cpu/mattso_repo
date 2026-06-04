import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog(tipo?: string) {
    const whereClause: any = { activo: true };
    if (tipo) {
      whereClause.tipo = tipo.toUpperCase();
    }

    const queryOptions: any = {
      where: whereClause,
      include: {
        certificacion: {
          include: {
            requisitos: true,
            vigencia: true,
          }
        }
      }
    };

    let productos = await this.prisma.producto.findMany(queryOptions);

    // Si la base está vacía, insertamos datos iniciales automáticamente (Seeding)
    if (productos.length === 0) {
      await this.seedDatabase();
      productos = await this.prisma.producto.findMany(queryOptions);
    }

    // Formateamos los datos para que coincidan con lo que el frontend React espera
    return productos.map((p: any) => {
      const cert = p.certificacion;
      const shortDescription = p.descripcion || (cert ? cert.descripcion : 'Sin descripción');
      
      const about = cert ? [
        cert.descripcion,
        'La certificación de cualificaciones o competencias laborales es el procedimiento mediante el cual un organismo reconocido determina formalmente que una persona ha alcanzado el desempeño esperado.',
        'Matsso Certificación actúa como Organismo Evaluador de Conformidad (OEC), otorgando la certificación en una o varias unidades de competencia.'
      ] : [
        p.descripcion || 'Sin descripción',
        'Fortalece tus competencias con nuestros cursos avalados por las autoridades correspondientes.'
      ];
      
      const features = [
        { icon: 'fa-regular fa-clock', title: 'Vigencia', desc: cert ? `${cert.vigencia?.etiqueta || '2 años'}` : '2 años' },
        { icon: 'fa-solid fa-screwdriver-wrench', title: 'Modalidad', desc: p.modalidad || 'Virtual' },
        { icon: 'fa-regular fa-file-lines', title: 'Evaluación Teórica', desc: 'Banco de preguntas (mínimo 70%).' },
        { icon: 'fa-solid fa-chart-line', title: 'Evaluación Práctica', desc: 'Casos prácticos (100%).' }
      ];
      
      const requirements = cert && cert.requisitos.length > 0
        ? cert.requisitos.map((r, index) => ({
            number: String(index + 1).padStart(2, '0'),
            title: r.tipo,
            desc: r.descripcion
          }))
        : [
            { number: '01', title: 'Documentos Personales', desc: 'Cédula de Identidad y Papeleta de Votación.' },
            { number: '02', title: 'Educación', desc: 'Educación general básica.' },
            { number: '03', title: 'Experiencia', desc: '6 meses en actividades relacionadas.' },
            { number: '04', title: 'Capacitación', desc: '60 horas en temas relacionados al perfil.' }
          ];

      return {
        id: Number(p.id),
        titulo: p.titulo,
        precio: Number(p.precio),
        imagen: p.imagen_url || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
        categoria: p.tipo === 'CERTIFICACION' ? 'Certificación Profesional' : 'Seguridad Industrial',
        modalidad: p.modalidad || 'Virtual',
        horas: p.horas ? `${p.horas} horas` : '40 horas',
        vigencia: cert?.vigencia?.anos || 2,
        inicia: 'Inscripciones Abiertas',
        slug: p.titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        tipo: p.tipo.toLowerCase(),
        descripcion: p.descripcion || 'Sin descripción',
        shortDescription,
        about,
        features,
        requirements
      };
    });
  }

  async getProductBySlug(slug: string) {
    const catalog = await this.getCatalog();
    return catalog.find(p => p.slug === slug) || null;
  }

  private async seedDatabase() {
    const defaultProducts = [
      { tipo: 'CAPACITACION', titulo: 'Prevención de Riesgos: Construcción', precio: 90.00, modalidad: 'Virtual', horas: 40, imagen_url: 'https://campusmatsso.com/wp-content/uploads/2022/03/Construccion22-Julio-Ari-02-600x314.jpg' },
      { tipo: 'CAPACITACION', titulo: 'Formación de Formadores', precio: 90.00, modalidad: 'Virtual', horas: 60, imagen_url: 'https://campusmatsso.com/wp-content/uploads/2022/03/SliderSquare-02-600x600.jpg' },
      { tipo: 'CAPACITACION', titulo: 'Energía Eléctrica: Prevención de Riesgos', precio: 90.00, modalidad: 'Virtual', horas: 40, imagen_url: 'https://campusmatsso.com/wp-content/uploads/2022/03/SliderSquare-03-600x600.jpg' },
      { tipo: 'CERTIFICACION', titulo: 'Prevención de Riesgos Laborales', precio: 150.00, modalidad: 'Virtual', horas: 120, imagen_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
      { tipo: 'CERTIFICACION', titulo: 'Asistencia en Seguridad Industrial', precio: 120.00, modalidad: 'Presencial', horas: 80, imagen_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80' }
    ];

    for (const prod of defaultProducts) {
      await this.prisma.producto.create({
        data: prod
      });
    }
  }
}
