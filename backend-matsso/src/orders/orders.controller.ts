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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { OrdersService } from './orders.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

@Controller('api/ordenes')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── POST /api/ordenes — Crear orden con comprobante ────────────────────────
  @Post()
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads'),
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.bin';
          cb(null, `comprobante-${uniqueSuffix}${safeExt}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Tipo de archivo no permitido. Solo se aceptan imágenes y PDF.'),
            false,
          );
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createOrder(@UploadedFile() file: any, @Body('data') dataString: string) {
    if (!dataString) throw new BadRequestException('Falta el cuerpo de datos de la orden.');
    let body: any;
    try {
      body = JSON.parse(dataString);
    } catch {
      throw new BadRequestException('El cuerpo de datos de la orden no es JSON válido.');
    }
    const comprobanteUrl = file ? `/uploads/${file.filename}` : null;
    return this.ordersService.createOrder({ ...body, comprobanteUrl });
  }

  // ── GET /api/ordenes — Listar órdenes (protegido por API key del panel admin) ──
  @Get()
  async getAllOrders(@Headers('x-admin-key') adminKey: string) {
    if (adminKey !== process.env.ADMIN_API_KEY) {
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
    if (adminKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Clave de administrador inválida.');
    }
    if (!['PAGADA', 'RECHAZADA'].includes(estado)) {
      throw new BadRequestException('Estado debe ser PAGADA o RECHAZADA.');
    }
    return this.ordersService.updateOrderStatus(Number(id), estado as 'PAGADA' | 'RECHAZADA');
  }
}
