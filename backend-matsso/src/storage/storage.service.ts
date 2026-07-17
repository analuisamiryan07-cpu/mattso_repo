import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const BUCKET = 'comprobantes';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient | null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (url && key) {
      this.client = createClient(url, key);
      this.logger.log('Supabase Storage configurado correctamente');
    } else {
      this.client = null;
      this.logger.warn('SUPABASE_URL o SUPABASE_SERVICE_KEY no configurados — usando almacenamiento local como fallback');
    }
  }

  async uploadComprobante(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname || '').toLowerCase() || '.bin';
    const filename = `comprobante-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;

    if (!this.client) {
      return this.saveToLocalDisk(file.buffer, filename);
    }

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Error subiendo a Supabase Storage: ${error.message} — usando fallback local`);
      return this.saveToLocalDisk(file.buffer, filename);
    }

    const { data: urlData } = this.client.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  private saveToLocalDisk(buffer: Buffer, filename: string): string {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    writeFileSync(join(uploadDir, filename), buffer);
    return `/uploads/${filename}`;
  }
}
