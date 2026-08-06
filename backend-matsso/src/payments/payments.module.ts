import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { PaypalApiService } from './paypal/paypal-api.service';
import { PaypalService } from './paypal/paypal.service';
import { PaypalWebhookService } from './paypal/paypal-webhook.service';
import { PaypalController } from './paypal/paypal.controller';
import { PaypalWebhookController } from './paypal/paypal-webhook.controller';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [PaypalController, PaypalWebhookController],
  providers: [PaypalApiService, PaypalService, PaypalWebhookService],
})
export class PaymentsModule {}
