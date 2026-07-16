import { Module, Controller, Get } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, SkipThrottle } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { CatalogModule } from './catalog/catalog.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ContactModule } from './contact/contact.module';
import { EmailModule } from './email/email.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';

@SkipThrottle()
@Controller('api')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

// BullMQ solo se carga si REDIS_URL está configurado
const bullImports = process.env.REDIS_URL
  ? [
      BullModule.forRoot({ connection: { url: process.env.REDIS_URL } }),
      QueueModule,
    ]
  : [];

@Module({
  imports: [
    // Rate limiting: 60 requests/min globales; auth endpoints los sobrescriben a 10/min
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60000, limit: 60 }]),
    ...bullImports,
    PrismaModule,
    EmailModule,
    StorageModule,
    ChatModule,
    CatalogModule,
    AuthModule,
    OrdersModule,
    ContactModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
