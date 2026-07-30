import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  curso: string;      // nombre de la carpeta padre (ej: "Gestión Ambiental - Cohorte 09")
  viewUrl: string;
  downloadUrl: string;
  size: string | null;
  modifiedTime: string | null;
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private drive: drive_v3.Drive | null = null;
  private folderId: string | null = null;

  private cache = new Map<string, { data: DriveFile[]; expires: number }>();
  private folderNameCache = new Map<string, string>();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor() {
    const credRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!credRaw || !folderId) {
      this.logger.warn('GOOGLE_SERVICE_ACCOUNT_JSON o GOOGLE_DRIVE_FOLDER_ID no configurados.');
      return;
    }

    try {
      const credentials = credRaw.trim().startsWith('{')
        ? JSON.parse(credRaw)
        : JSON.parse(Buffer.from(credRaw, 'base64').toString('utf-8'));

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.folderId = folderId;
      this.logger.log('Google Drive client inicializado.');
    } catch (err) {
      this.logger.error('Error inicializando Drive client: ' + err);
    }
  }

  isConfigured(): boolean {
    return this.drive !== null;
  }

  async getCertificatesByName(nombre: string): Promise<DriveFile[]> {
    if (!this.drive || !this.folderId) {
      throw new Error('Google Drive no está configurado.');
    }

    const cacheKey = nombre.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Búsqueda recursiva en toda la carpeta raíz usando "in ancestors"
    // orderBy no está soportado con 'in ancestors' en Drive API v3
    const res = await this.drive.files.list({
      q: `'${this.folderId}' in ancestors and name contains '${nombre}' and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, parents)',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const rawFiles = (res.data.files ?? []).sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', 'es'),
    );

    // Obtener nombres de carpetas padre (curso/cohorte) en paralelo
    const parentIds = [...new Set(
      rawFiles.map((f) => f.parents?.[0]).filter(Boolean) as string[]
    )];

    const folderNames = await this.batchGetFolderNames(parentIds);

    const files: DriveFile[] = rawFiles.map((f) => ({
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      curso: folderNames[f.parents?.[0] ?? ''] ?? '',
      viewUrl: `https://drive.google.com/file/d/${f.id}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
      size: f.size ?? null,
      modifiedTime: f.modifiedTime ?? null,
    }));

    this.cache.set(cacheKey, { data: files, expires: Date.now() + this.CACHE_TTL });
    return files;
  }

  private async batchGetFolderNames(ids: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const toFetch = ids.filter((id) => !this.folderNameCache.has(id));

    if (toFetch.length > 0) {
      const fetched = await Promise.all(
        toFetch.map((id) =>
          this.drive!.files.get({ fileId: id, fields: 'id,name' }).catch(() => null),
        ),
      );
      for (const r of fetched) {
        if (r?.data?.id && r.data.name) {
          this.folderNameCache.set(r.data.id, r.data.name);
        }
      }
    }

    for (const id of ids) {
      result[id] = this.folderNameCache.get(id) ?? '';
    }
    return result;
  }
}
