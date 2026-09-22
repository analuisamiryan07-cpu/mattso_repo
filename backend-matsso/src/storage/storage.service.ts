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

  // Slots de imagen fija: se pisan al volver a subir (mismo public_id,
  // overwrite: true) — igual que el viejo esquema numérico de
  // capacitaciones/certificaciones, pero sin choque posible porque la
  // carpeta es única por curso (ver lms/courses/course-cloudinary.util.ts).
  // "moodle"/"coursera" no son un slot fijo: cada imagen que se sube ahí
  // queda como un archivo nuevo dentro de esa subcarpeta.
  private static readonly SLOTS_FIJOS = ['hero', 'izquierda', 'derecha'] as const;

  /** Imagen de un curso — Cursos/{cloudinaryFolder}/{slot} (fijos) o Cursos/{cloudinaryFolder}/{slot}/{uuid}. */
  async uploadCourseImage(
    file: Express.Multer.File,
    cloudinaryFolder: string,
    slot: string,
  ): Promise<string> {
    if (!this.ready) {
      throw new InternalServerErrorException('El almacenamiento de imágenes no está configurado. Contacte al administrador.');
    }

    const esFijo = (StorageService.SLOTS_FIJOS as readonly string[]).includes(slot);
    const publicId = esFijo
      ? `Cursos/${cloudinaryFolder}/${slot}`
      : `Cursos/${cloudinaryFolder}/${slot}/${randomUUID()}`;

    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          overwrite: esFijo,
          tags: ['curso', 'lms', 'matsso'],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('Error subiendo imagen de curso a Cloudinary:', error?.message);
            reject(new InternalServerErrorException('No se pudo subir la imagen. Intenta de nuevo.'));
            return;
          }
          this.logger.log(`Imagen de curso subida: ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );

      const readable = Readable.from(file.buffer);
      readable.pipe(uploadStream);
    });
  }

  /** Mismo patrón que uploadComprobante, carpeta y tags propios para entregas del LMS. */
  async uploadEntregaTarea(file: Express.Multer.File): Promise<string> {
    if (!this.ready) {
      throw new InternalServerErrorException(
        'El almacenamiento de entregas no está configurado. Contacte al administrador.',
      );
    }

    const isRaw = file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png';
    const publicId = `lms/entregas/${randomUUID()}`;

    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: isRaw ? 'raw' : 'image',
          overwrite: false,
          tags: ['entrega', 'lms', 'matsso'],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('Error subiendo entrega a Cloudinary:', error?.message);
            reject(new InternalServerErrorException('No se pudo subir la entrega. Intenta de nuevo.'));
            return;
          }
          this.logger.log(`Entrega subida: ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );

      const readable = Readable.from(file.buffer);
      readable.pipe(uploadStream);
    });
  }
}
