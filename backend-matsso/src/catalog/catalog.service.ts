import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Mapeo fijo número → carpeta Cloudinary (independiente del título en BD)
const CLOUDINARY_FOLDER: Record<string, string> = {
  '001': 'Actividades Auxiliares de Liniero',
  '002': 'Administración de Empresas',
  '003': 'Armado de Estructuras Metálicas',
  '004': 'Asesoría de Imagen',
  '005': 'Asistencia a la Supervisión de Actividades de Construcción - Estructura e Infraestructura',
  '006': 'Asistencia de Contabilidad',
  '007': 'Asistencia en Actividades de Articulación Local para la Prevención y Reducción de la Desnutrición Crónica Infantil',
  '008': 'Asistencia en Gestión Documental y Archivo',
  '009': 'Asistencia en Seguridad Industrial',
  '010': 'Atención Integral en Centro de Desarrollo Infantil',
  '011': 'Conductor Profesional de Bus - NTE INEN 2 463: 2008',
  '012': 'Consejerías de Atención Familiar del Servicio Creciendo con Nuestros Hijos (CNH)',
  '013': 'Coordinación en Centros de Desarrollo Infantil',
  '014': 'Coordinación Territorial para la Prevención y Reducción de la Desnutrición Crónica Infantil',
  '015': 'Cosmetología',
  '016': 'Cosmiatría',
  '017': 'Cuidado de Personas Adultas Mayores',
  '018': 'Diseño Gráfico y Comunicación Visual',
  '019': 'Entrenamiento Canino: Defensa y Protección',
  '020': 'Entrenamiento Canino: Detección de Sustancias y Localización de Personas',
  '021': 'Entrenamiento Canino: Intervención Asistida con Canes',
  '022': 'Evaluación de la Calidad y Excelencia en la Gestión Pública',
  '023': 'Facilitación en Actividades de Capacitación',
  '024': 'Facilitación en Actividades de Capacitación - Formación Dual',
  '025': 'Fotógrafo en Medios y Multimedia',
  '026': 'Gestión Administrativa',
  '027': 'Gestión Administrativa del Sistema de Salud Desconcentrado',
  '028': 'Gestión Ambiental',
  '029': 'Gestión en Promoción de Marcas, Productos y Servicios',
  '030': 'Gestión de Soldadura',
  '031': 'Gestión Integral de Riesgos Financieros',
  '032': 'Instalaciones Eléctricas',
  '033': 'Instalaciones Hidrosanitarias',
  '034': 'Maquillaje',
  '035': 'Neurodesarrollo y Necesidades Educativas Especiales en el Periodo Infantojuvenil',
  '036': 'Ofimática: Asistencia Administrativa con Manejo de Ofimática',
  '037': 'Operación y Mantenimiento de las Redes del Sistema de Distribución de Energía Eléctrica - Líneas Aéreas',
  '038': 'Operación y Mantenimiento de las Redes del Sistema de Distribución de Energía Eléctrica - Líneas Subterráneas',
  '039': 'Operaciones Archivísticas - Administración de Archivos',
  '040': 'Operaciones Auxiliares en Limpieza de Unidades de Salud',
  '041': 'Operaciones de Líneas y Redes Energizadas',
  '042': 'Preparación Gastronómica de Cocina',
  '043': 'Prevención de Riesgos Laborales en Actividades de Alto Riesgo: Construcción y Obra Civil',
  '044': 'Prevención de Riesgos Laborales en Actividades de Alto Riesgo: Energía Eléctrica',
  '045': 'Prevención e Intervención en los Problemas del Comportamiento y de la Afectividad',
  '046': 'Seguridad Industrial',
  '047': 'Soldadura',
  '048': 'Supervisión de Edificaciones y Obras Civiles',
  '049': 'Supervisión de la Gestión Documental y Archivo',
};

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
        cloudinaryFolder: cloudinaryNum
          ? `Home/Certificaciones/${CLOUDINARY_FOLDER[cloudinaryNum]}`
          : `Home/Certificaciones/${p.titulo}`,
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
