import { Controller, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OrdersService } from './orders.service';

@Controller('api/ordenes')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('comprobante', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  async createOrder(
    @UploadedFile() file: any,
    @Body('data') dataString: string
  ) {
    if (!dataString) {
      throw new Error('Falta el cuerpo de datos de la orden.');
    }
    const body = JSON.parse(dataString);
    const comprobanteUrl = file ? `/uploads/${file.filename}` : null;
    return this.ordersService.createOrder({
      ...body,
      comprobanteUrl
    });
  }
}
