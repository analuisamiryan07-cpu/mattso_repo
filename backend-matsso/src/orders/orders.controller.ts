import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Headers,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './orders.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Primeros 8 bytes (magic bytes) esperados por tipo MIME
const MAGIC_BYTES: Record<string, (buf: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8,
  'image/png':  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  'application/pdf': (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
};

function verifyMagicBytes(file: Express.Multer.File): boolean {
  const check = MAGIC_BYTES[file.mimetype];
  return check ? check(file.buffer) : false;
}

@Controller('api/ordenes')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly storageService: StorageService,
  ) {}

  // ── POST /api/ordenes — Crear orden (requiere JWT) ─────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de archivo no permitido. Solo imágenes JPG, PNG, WebP y PDF.'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createOrder(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('data') dataString: string,
  ) {
    if (!file) {
      throw new BadRequestException('El comprobante de pago es obligatorio.');
    }

    // Verificar magic bytes para prevenir MIME spoofing
    if (!verifyMagicBytes(file)) {
      throw new BadRequestException('El archivo no corresponde al tipo declarado.');
    }

    if (!dataString) throw new BadRequestException('Falta el cuerpo de datos de la orden.');

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(dataString);
    } catch {
      throw new BadRequestException('El cuerpo de datos de la orden no es JSON válido.');
    }

    // Validar estructura mínima del body
    if (!Array.isArray(parsedBody?.items) || parsedBody.items.length === 0) {
      throw new BadRequestException('La orden debe contener al menos un producto.');
    }

    // Construir DTO limpio — ignoramos precio si el cliente lo envía
    const dto: CreateOrderDto = {
      items: parsedBody.items.map((i: any) => ({
        id: Number(i.id),
        cantidad: Number(i.cantidad) || 1,
      })),
    };

    const comprobanteUrl = await this.storageService.uploadComprobante(file);

    // El usuario viene del JWT — nunca del body del cliente
    return this.ordersService.createOrder(dto, req.user.id, comprobanteUrl);
  }

  // ── GET /api/ordenes — Listar órdenes (panel admin — clave temporal) ───────
  @Get()
  async getAllOrders(@Headers('x-admin-key') adminKey: string) {
    if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Clave de administrador inválida.');
    }
    return this.ordersService.getAllOrders();
  }

  // ── PATCH /api/ordenes/:id/estado — Aprobar o rechazar orden ──────────────
  @Patch(':id/estado')
  async updateStatus(
    @Param('id') id: string,
    @Body('estado') estado: string,
    @Body('motivo') motivo: string,
    @Headers('x-admin-key') adminKey: string,
  ) {
    if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Clave de administrador inválida.');
    }
    if (!['PAGADA', 'RECHAZADA'].includes(estado)) {
      throw new BadRequestException('Estado debe ser PAGADA o RECHAZADA.');
    }
    if (estado === 'RECHAZADA' && !motivo?.trim()) {
      throw new BadRequestException('Se debe indicar el motivo del rechazo.');
    }
    return this.ordersService.updateOrderStatus(Number(id), estado as 'PAGADA' | 'RECHAZADA', motivo);
  }
}
