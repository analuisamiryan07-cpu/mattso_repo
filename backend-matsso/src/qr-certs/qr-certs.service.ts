import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class QrCertsService {
  constructor(private readonly prisma: PrismaService) {}

  private genCodigo(): string {
    return crypto.randomBytes(6).toString('hex');
  }

  private format(r: any) {
    return {
      id:               Number(r.id),
      codigo:           r.codigo,
      nombres:          r.nombres,
      certificado:      r.certificado,
      fecha_emision:    r.fecha_emision,
      fecha_expiracion: r.fecha_expiracion,
      estado:           r.estado,
      created_at:       r.created_at,
    };
  }

  async create(data: {
    nombres: string;
    certificado: string;
    fecha_emision: string;
    fecha_expiracion: string;
    estado?: string;
  }) {
    const db = this.prisma as any;
    let codigo: string;
    do {
      codigo = this.genCodigo();
    } while (await db.qrCertificado.findUnique({ where: { codigo } }));

    const record = await db.qrCertificado.create({
      data: {
        codigo,
        nombres:          data.nombres,
        certificado:      data.certificado,
        fecha_emision:    data.fecha_emision,
        fecha_expiracion: data.fecha_expiracion,
        estado:           data.estado || 'VIGENTE',
      },
    });
    return this.format(record);
  }

  async findAll() {
    const rows = await (this.prisma as any).qrCertificado.findMany({
      orderBy: { created_at: 'desc' },
    });
    return (rows as any[]).map(r => this.format(r));
  }

  async findByCodigo(codigo: string) {
    const record = await (this.prisma as any).qrCertificado.findUnique({
      where: { codigo },
    });
    if (!record) throw new NotFoundException('Certificado no encontrado');
    return this.format(record);
  }

  async remove(id: bigint) {
    await (this.prisma as any).qrCertificado.delete({ where: { id } });
    return { deleted: true };
  }
}
