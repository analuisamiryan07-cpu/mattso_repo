import { Module } from '@nestjs/common';
import { QrCertsService } from './qr-certs.service';
import { QrCertsController, VerificarController } from './qr-certs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QrCertsController, VerificarController],
  providers: [QrCertsService],
})
export class QrCertsModule {}
