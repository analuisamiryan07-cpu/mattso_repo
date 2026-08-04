import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreatePaypalOrderDto } from './dto/create-paypal-order.dto';
import { CapturePaypalOrderDto } from './dto/capture-paypal-order.dto';

@Controller('api/payments/paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  // POST /api/payments/paypal/orders
  // Crea la orden interna + orden PayPal en un solo paso
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Req() req: any, @Body() dto: CreatePaypalOrderDto) {
    return this.paypalService.createPaypalOrder(dto.items, req.user.id);
  }

  // POST /api/payments/paypal/orders/:paypalOrderId/capture
  @Post('orders/:paypalOrderId/capture')
  @UseGuards(JwtAuthGuard)
  async captureOrder(
    @Req() req: any,
    @Param('paypalOrderId') paypalOrderId: string,
    @Body() dto: CapturePaypalOrderDto,
  ) {
    return this.paypalService.capturePaypalOrder(paypalOrderId, dto.internalOrderId, req.user.id);
  }
}
