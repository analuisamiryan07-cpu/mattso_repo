import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly ready: boolean;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.ready = true;
      this.logger.log('Cloudinary configurado correctamente');
    } else {
      this.ready = false;
      this.logger.warn(
        'CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET no configurados — uploads desactivados',
      );
    }
  }

  async uploadComprobante(file: Express.Multer.File): Promise<string> {
    if (!this.ready) {
      throw new InternalServerErrorException(
        'El almacenamiento de comprobantes no está configurado. Contacte al administrador.',
      );
    }

    const isPdf = file.mimetype === 'application/pdf';
    const publicId = `comprobantes/${randomUUID()}`;

    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: isPdf ? 'raw' : 'image',
          folder: undefined, // la carpeta ya va en public_id
          overwrite: false,
          tags: ['comprobante', 'matsso'],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('Error subiendo comprobante a Cloudinary:', error?.message);
            reject(new InternalServerErrorException('No se pudo subir el comprobante. Intenta de nuevo.'));
            return;
          }
          this.logger.log(`Comprobante subido: ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );

      const readable = Readable.from(file.buffer);
      readable.pipe(uploadStream);
    });
  }
}
