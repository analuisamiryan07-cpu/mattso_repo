import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { StorageModule } from '../storage/storage.module';
import { EMAIL_QUEUE } from '../queue/queue.constants';

// Solo registrar la cola si Redis está configurado
const queueImports = process.env.REDIS_URL
  ? [BullModule.registerQueue({ name: EMAIL_QUEUE })]
  : [];

@Module({
  imports: [PrismaModule, EmailModule, StorageModule, ...queueImports],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
