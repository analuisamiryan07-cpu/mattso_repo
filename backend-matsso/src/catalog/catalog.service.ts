import { Injectable, NotFoundException } from '@nestjs/common';
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

  private invalidateCache() {
    this._cache = null;
  }

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

  // ── Admin CRUD ────────────────────────────────────────────────────────────

  async getAllProducts() {
    const rows = await this.prisma.producto.findMany({
      orderBy: [{ tipo: 'asc' }, { titulo: 'asc' }],
    });
    return (rows as any[]).map(p => ({
      id:                Number(p.id),
      tipo:              p.tipo,
      titulo:            p.titulo,
      descripcion:       p.descripcion,
      descripcion_larga: p.descripcion_larga ?? null,
      precio:            Number(p.precio),
      horas:             p.horas,
      modalidad:         p.modalidad,
      fecha:             p.fecha ?? null,
      horario:           p.horario ?? null,
      imagen_url:        p.imagen_url,
      activo:            p.activo,
      destacado:         p.destacado,
      id_certificacion:  p.id_certificacion,
      created_at:        p.created_at,
    }));
  }

  async createProduct(data: {
    tipo: string;
    titulo: string;
    descripcion?: string;
    descripcion_larga?: string;
    precio: number | string;
    horas?: number | string | null;
    modalidad?: string;
    fecha?: string | null;
    horario?: string | null;
    imagen_url?: string | null;
    activo?: boolean | string;
    destacado?: boolean | string;
  }) {
    const created = await this.prisma.producto.create({
      data: {
        tipo:              data.tipo,
        titulo:            data.titulo,
        descripcion:       data.descripcion || null,
        descripcion_larga: data.descripcion_larga || null,
        precio:            Number(data.precio),
        horas:             data.horas ? Number(data.horas) : null,
        modalidad:         data.modalidad || null,
        fecha:             data.fecha || null,
        horario:           data.horario || null,
        imagen_url:        data.imagen_url || null,
        activo:      data.activo === true || data.activo === 'true' || data.activo === '1',
        destacado:   data.destacado === true || data.destacado === 'true' || data.destacado === '1',
      },
    });
    this.invalidateCache();
    return { id: Number(created.id), titulo: created.titulo };
  }

  async updateProduct(
    id: bigint,
    data: {
      tipo?: string;
      titulo?: string;
      descripcion?: string | null;
      descripcion_larga?: string | null;
      precio?: number | string;
      horas?: number | string | null;
      modalidad?: string | null;
      fecha?: string | null;
      horario?: string | null;
      imagen_url?: string | null;
      activo?: boolean | string;
      destacado?: boolean | string;
    },
  ) {
    const updated = await this.prisma.producto.update({
      where: { id },
      data: {
        ...(data.tipo              !== undefined && { tipo: data.tipo }),
        ...(data.titulo            !== undefined && { titulo: data.titulo }),
        ...(data.descripcion       !== undefined && { descripcion: data.descripcion || null }),
        ...(data.descripcion_larga !== undefined && { descripcion_larga: (data as any).descripcion_larga || null }),
        ...(data.precio            !== undefined && { precio: Number(data.precio) }),
        ...(data.horas             !== undefined && { horas: data.horas ? Number(data.horas) : null }),
        ...(data.modalidad         !== undefined && { modalidad: data.modalidad || null }),
        ...(data.fecha             !== undefined && { fecha: (data as any).fecha || null }),
        ...(data.horario           !== undefined && { horario: (data as any).horario || null }),
        ...(data.imagen_url        !== undefined && { imagen_url: data.imagen_url || null }),
        ...(data.activo            !== undefined && {
          activo: data.activo === true || data.activo === 'true' || data.activo === '1',
        }),
        ...(data.destacado         !== undefined && {
          destacado: data.destacado === true || data.destacado === 'true' || data.destacado === '1',
        }),
      } as any,
    });
    this.invalidateCache();
    return { id: Number(updated.id), titulo: updated.titulo };
  }

  async toggleProduct(id: bigint) {
    const product = await this.prisma.producto.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    const updated = await this.prisma.producto.update({
      where: { id },
      data:  { activo: !product.activo },
    });
    this.invalidateCache();
    return { id: Number(updated.id), activo: updated.activo };
  }

  async deleteProduct(id: bigint) {
    await this.prisma.producto.delete({ where: { id } });
    this.invalidateCache();
    return { deleted: true };
  }

  // ── Mapeo interno (catálogo público) ─────────────────────────────────────

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
      const shortDescription = p.descripcion_larga || p.descripcion || (cert ? cert.descripcion : 'Sin descripción');

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

      const isCapacitacion = p.tipo === 'CAPACITACION';
      const features = isCapacitacion
        ? [
            ...(p.fecha    ? [{ icon: 'fa-regular fa-calendar', title: 'Fecha',    desc: p.fecha }]    : []),
            ...(p.horario  ? [{ icon: 'fa-regular fa-clock',    title: 'Horario',  desc: p.horario }]  : []),
            { icon: 'fa-solid fa-dollar-sign',        title: 'Precio',    desc: `$${Number(p.precio).toFixed(2)} (dólares)` },
            { icon: 'fa-solid fa-screwdriver-wrench', title: 'Modalidad', desc: p.modalidad || 'Presencial' },
          ]
        : [
            { icon: 'fa-regular fa-clock',            title: 'Vigencia',            desc: cert?.vigencia?.etiqueta || '2 años' },
            { icon: 'fa-solid fa-screwdriver-wrench', title: 'Modalidad',           desc: evalSede?.descripcion || p.modalidad || 'Virtual' },
            { icon: 'fa-regular fa-file-lines',       title: 'Evaluación Teórica',  desc: evalTeorico?.descripcion  || 'Banco de preguntas (mínimo 70%).' },
            { icon: 'fa-solid fa-chart-line',         title: 'Evaluación Práctica', desc: evalPractico?.descripcion || 'Casos prácticos (100%).' },
          ];

      const tipoLabel: Record<string, string> = {
        FORMACION:    'Formación',
        EXPERIENCIA:  'Experiencia',
        CAPACITACION: 'Capacitación Previa',
        OTRO:         'Requisito General',
      };

      const requirements = cert && cert.requisitos.length > 0
        ? cert.requisitos.map((r: any, index: number) => ({
            number: String(index + 1).padStart(2, '0'),
            title: tipoLabel[r.tipo] ?? r.tipo,
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

      const cloudinaryNum = p.imagen_url?.match(/^\d{2,3}$/) ? p.imagen_url : null;
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
        slug: p.tipo.toLowerCase() !== 'capacitacion' && cert?.codigo
          ? cert.codigo.toLowerCase()
          : p.titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        cloudinaryFolder: cloudinaryNum
          ? `Home/Certificaciones/${CLOUDINARY_FOLDER[cloudinaryNum]}`
          : `Home/Certificaciones/${p.titulo}`,
        cloudinaryNum,
        tipo: p.tipo.toLowerCase(),
        descripcion:       p.descripcion_larga || p.descripcion || 'Sin descripción',
        descripcion_larga: p.descripcion_larga || null,
        fecha:             p.fecha    || null,
        horario:           p.horario  || null,
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
