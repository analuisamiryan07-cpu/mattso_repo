import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { OrdersService } from './orders.service';

// FIX [PathTraversal]: Lista blanca de extensiones y tipos MIME permitidos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

@Controller('api/ordenes')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('comprobante', {
    storage: diskStorage({
      destination: join(__dirname, '..', '..', 'uploads'),
      filename: (_req, file, cb) => {
        // FIX [PathTraversal]: Nombre generado internamente, nunca usando originalname como ruta
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname).toLowerCase();
        const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.bin';
        cb(null, `comprobante-${uniqueSuffix}${safeExt}`);
      },
    }),
    // FIX [PathTraversal + Validation Required]: Filtro de tipo MIME estricto
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Tipo de archivo no permitido. Solo se aceptan imágenes y PDF.'), false);
      }
    },
    // FIX [Configuration]: Límite de tamaño de archivo a 5MB
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async createOrder(
    @UploadedFile() file: any,
    @Body('data') dataString: string
  ) {
    if (!dataString) {
      throw new BadRequestException('Falta el cuerpo de datos de la orden.');
    }
    let body: any;
    try {
      body = JSON.parse(dataString);
    } catch {
      throw new BadRequestException('El cuerpo de datos de la orden no es JSON válido.');
    }
    const comprobanteUrl = file ? `/uploads/${file.filename}` : null;
    return this.ordersService.createOrder({
      ...body,
      comprobanteUrl,
    });
  }
}
