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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './orders.service';
import { StorageService } from '../storage/storage.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@Controller('api/ordenes')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly storageService: StorageService,
  ) {}

  // ── POST /api/ordenes — Crear orden con comprobante ────────────────────────
  @Post()
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Tipo de archivo no permitido. Solo imágenes y PDF.'),
            false,
          );
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createOrder(@UploadedFile() file: Express.Multer.File, @Body('data') dataString: string) {
    if (!dataString) throw new BadRequestException('Falta el cuerpo de datos de la orden.');

    let body: any;
    try {
      body = JSON.parse(dataString);
    } catch {
      throw new BadRequestException('El cuerpo de datos de la orden no es JSON válido.');
    }

    const comprobanteUrl = file
      ? await this.storageService.uploadComprobante(file)
      : null;

    return this.ordersService.createOrder({ ...body, comprobanteUrl });
  }

  // ── GET /api/ordenes — Listar órdenes (panel admin) ───────────────────────
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
    @Headers('x-admin-key') adminKey: string,
  ) {
    if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Clave de administrador inválida.');
    }
    if (!['PAGADA', 'RECHAZADA'].includes(estado)) {
      throw new BadRequestException('Estado debe ser PAGADA o RECHAZADA.');
    }
    return this.ordersService.updateOrderStatus(Number(id), estado as 'PAGADA' | 'RECHAZADA');
  }
}
