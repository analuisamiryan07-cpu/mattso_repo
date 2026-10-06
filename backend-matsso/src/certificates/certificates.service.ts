import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private drive: drive_v3.Drive | null = null;
  private folderId: string | null = null;

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
}
