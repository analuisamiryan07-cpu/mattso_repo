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
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { sanitizePlainText } from '../common/sanitize.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrdersService } from './orders.service';
import { CreateAdminOrderDto } from './dto/create-admin-order.dto';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Primeros 8 bytes (magic bytes) esperados por tipo MIME
const MAGIC_BYTES: Record<string, (buf: Buffer) => boolean> = {
  'image/jpeg': (b) => b.length > 2 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png':  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) => b.length > 11 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
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
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de archivo no permitido. Solo imágenes JPG, PNG o WebP.'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5, fieldSize: 64 * 1024 },
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

    if (typeof dataString !== 'string' || !dataString) throw new BadRequestException('Falta el cuerpo de datos de la orden.');

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(dataString);
    } catch {
      throw new BadRequestException('El cuerpo de datos de la orden no es JSON válido.');
    }

    // Validación real con class-validator — el body llega como JSON-dentro-de-string
    // en un multipart/form-data, así que el ValidationPipe global no se dispara solo.
    // Sin este paso, decoradores como @IsPositive()/@Max(10) del DTO nunca se ejecutan.
    const dto = plainToInstance(CreateOrderDto, parsedBody);
    const errores = await validate(dto);
    if (errores.length > 0) {
      throw new BadRequestException(
        errores.flatMap((e) => Object.values(e.constraints ?? {})),
      );
    }

    const comprobanteUrl = await this.storageService.uploadComprobante(file);

    // El usuario viene del JWT — nunca del body del cliente
    return this.ordersService.createOrder(dto, req.user.id, comprobanteUrl);
  }

  // ── POST /api/ordenes/admin — Crear orden ya PAGADA (venta por teléfono) ──
  // Mismo x-admin-key que el resto de este controller (no LMS_M2M_API_KEY:
  // esto no es exclusivo del LMS, sirve para cualquier tipo de producto).
  @UseGuards(AdminKeyGuard)
  @Post('admin')
  async createAdminOrder(@Body() dto: CreateAdminOrderDto) {
    return this.ordersService.createAdminOrder(dto, 'sistema-interno');
  }

  // ── GET /api/ordenes — Listar órdenes (panel admin — clave temporal) ───────
  @UseGuards(AdminKeyGuard)
  @Get()
  async getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  // ── PATCH /api/ordenes/:id/estado — Aprobar o rechazar orden ──────────────
  @UseGuards(AdminKeyGuard)
  @Patch(':id/estado')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: unknown,
    @Body('motivo') motivo: unknown,
  ) {
    if (estado !== 'PAGADA' && estado !== 'RECHAZADA') {
      throw new BadRequestException('Estado debe ser PAGADA o RECHAZADA.');
    }
    const motivoLimpio = typeof motivo === 'string' ? sanitizePlainText(motivo).slice(0, 500) : '';
    if (estado === 'RECHAZADA' && !motivoLimpio) {
      throw new BadRequestException('Se debe indicar el motivo del rechazo.');
    }
    return this.ordersService.updateOrderStatus(id, estado, motivoLimpio || undefined);
  }
}
