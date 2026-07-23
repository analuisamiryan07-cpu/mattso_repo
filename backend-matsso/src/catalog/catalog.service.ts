import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  private _cache: { data: any[]; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private async getAllFromCache(): Promise<any[]> {
    const now = Date.now();
    if (this._cache && now < this._cache.expiresAt) return this._cache.data;
    const data = await this._queryAndMap();
    this._cache = { data, expiresAt: now + 5 * 60 * 1000 };
    return data;
  }

  async getCatalog(tipo?: string, destacado?: boolean) {
    const all = await this.getAllFromCache();
    return all.filter(p => {
      if (tipo && p.tipo !== tipo.toLowerCase()) return false;
      if (destacado !== undefined && p.destacado !== destacado) return false;
      return true;
    });
  }

  async getProductBySlug(slug: string) {
    const all = await this.getAllFromCache();
    return all.find(p => p.slug === slug) || null;
  }

  private async _queryAndMap(): Promise<any[]> {
    const productos = await this.prisma.producto.findMany({
      where: { activo: { not: false } },
      include: {
        certificacion: {
          include: {
            requisitos:    { orderBy: { orden: 'asc' } },
            perfiles:      { orderBy: { orden: 'asc' } },
            conocimientos: { orderBy: { orden: 'asc' } },
            competencias:  { orderBy: { orden: 'asc' } },
            habilidades:   { orderBy: { orden: 'asc' } },
            evaluaciones:  true,
            vigencia: true,
            familia:  true,
            sector:   true,
          }
        }
      }
    });

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

      const evalTeorico  = cert?.evaluaciones?.find((e: any) => /teor/i.test(e.modalidad || ''));
      const evalPractico = cert?.evaluaciones?.find((e: any) => /prac/i.test(e.modalidad || ''));
      const evalSede     = cert?.evaluaciones?.find((e: any) => /sede/i.test(e.modalidad || ''));

      const features = [
        { icon: 'fa-regular fa-clock',        title: 'Vigencia',              desc: cert?.vigencia?.etiqueta || '2 años' },
        { icon: 'fa-solid fa-screwdriver-wrench', title: 'Modalidad',         desc: evalSede?.descripcion || p.modalidad || 'Virtual' },
        { icon: 'fa-regular fa-file-lines',   title: 'Evaluación Teórica',    desc: evalTeorico?.descripcion  || 'Banco de preguntas (mínimo 70%).' },
        { icon: 'fa-solid fa-chart-line',     title: 'Evaluación Práctica',   desc: evalPractico?.descripcion || 'Casos prácticos (100%).' }
      ];

      const requirements = cert && cert.requisitos.length > 0
        ? cert.requisitos.map((r: any, index: number) => ({
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

      const categoria = cert?.familia?.nombre
        || cert?.sector?.nombre
        || (p.tipo === 'CERTIFICACION' ? 'Certificación Profesional' : 'Capacitación');

      const cloudinaryNum = p.imagen_url?.match(/^\d{3}$/) ? p.imagen_url : null;
      const FALLBACK_IMG = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80';

      return {
        id: Number(p.id),
        titulo: p.titulo,
        precio: Number(p.precio),
        imagen: cloudinaryNum ? FALLBACK_IMG : (p.imagen_url || FALLBACK_IMG),
        categoria,
        modalidad: p.modalidad || 'Virtual',
        horas: p.horas ? `${p.horas} horas` : '40 horas',
        vigencia: cert?.vigencia?.anos || 2,
        inicia: 'Inscripciones Abiertas',
        slug: p.titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        cloudinaryFolder: `Certificaciones/${p.titulo}`,
        cloudinaryNum,
        tipo: p.tipo.toLowerCase(),
        descripcion: p.descripcion || 'Sin descripción',
        destacado: p.destacado ?? false,
        shortDescription,
        about,
        features,
        requirements,
        perfiles:      cert ? cert.perfiles.map((pf: any) => pf.descripcion) : [],
        conocimientos: cert ? cert.conocimientos.map((k: any) => k.descripcion) : [],
        competencias:  cert ? cert.competencias.map((c: any) => c.descripcion) : [],
        habilidades:   cert ? {
          teoricas:  cert.habilidades.filter((h: any) => h.tipo === 'TEORICA').map((h: any) => h.descripcion),
          practicas: cert.habilidades.filter((h: any) => h.tipo === 'PRACTICA').map((h: any) => h.descripcion),
        } : { teoricas: [], practicas: [] },
      };
    });
  }
}
