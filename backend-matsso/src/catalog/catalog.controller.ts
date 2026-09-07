import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  Headers,
  NotFoundException,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ParseHashIdPipe } from '../common/parse-hash-id.pipe';

@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  private checkAdminKey(adminKey: string) {
    if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Clave de administrador inválida.');
    }
  }

  // ── Endpoints públicos ────────────────────────────────────────────────────

  @Get()
  async getCatalog(
    @Query('tipo') tipo?: string,
    @Query('destacado') destacado?: string,
  ) {
    const destacadoBool =
      destacado === 'true' ? true : destacado === 'false' ? false : undefined;
    return this.catalogService.getCatalog(tipo, destacadoBool);
  }

  // ── Endpoints admin (DEBEN ir antes de :slug para evitar conflictos) ──────

  @Get('admin')
  async getAllAdmin(@Headers('x-admin-key') adminKey: string) {
    this.checkAdminKey(adminKey);
    return this.catalogService.getAllProducts();
  }

  @Post('admin')
  async createProduct(
    @Headers('x-admin-key') adminKey: string,
    @Body() dto: CreateProductDto,
  ) {
    this.checkAdminKey(adminKey);
    return this.catalogService.createProduct(dto);
  }

  @Put('admin/:id')
  async updateProduct(
    @Param('id', ParseHashIdPipe) id: number,
    @Headers('x-admin-key') adminKey: string,
    @Body() dto: UpdateProductDto,
  ) {
    this.checkAdminKey(adminKey);
    return this.catalogService.updateProduct(BigInt(id), dto);
  }

  @Patch('admin/:id/toggle')
  @HttpCode(200)
  async toggleProduct(
    @Param('id', ParseHashIdPipe) id: number,
    @Headers('x-admin-key') adminKey: string,
  ) {
    this.checkAdminKey(adminKey);
    return this.catalogService.toggleProduct(BigInt(id));
  }

  @Delete('admin/:id')
  @HttpCode(200)
  async deleteProduct(
    @Param('id', ParseHashIdPipe) id: number,
    @Headers('x-admin-key') adminKey: string,
  ) {
    this.checkAdminKey(adminKey);
    return this.catalogService.deleteProduct(BigInt(id));
  }

  // ── Ruta por slug (debe ir al final para no capturar rutas admin) ─────────

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.catalogService.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }
}
