import { Module, Controller, Get } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { CatalogModule } from './catalog/catalog.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ContactModule } from './contact/contact.module';

// Health check endpoint requerido por Render para verificar que el servicio está activo
@Controller('api')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

@Module({
  imports: [PrismaModule, ChatModule, CatalogModule, AuthModule, OrdersModule, ContactModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

