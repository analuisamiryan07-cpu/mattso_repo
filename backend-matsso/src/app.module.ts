import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { CatalogModule } from './catalog/catalog.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [PrismaModule, ChatModule, CatalogModule, AuthModule, OrdersModule, ContactModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
