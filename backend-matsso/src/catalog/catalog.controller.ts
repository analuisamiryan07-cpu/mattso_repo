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
  NotFoundException,
  HttpCode,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ── Endpoints públicos ────────────────────────────────────────────────────

  @Get()
  async getCatalog(
    @Query('tipo') tipo?: string,
    @Query('destacado') destacado?: string,
  ) {
    const destacadoBool =
      destacado === 'true' ? true : destacado === 'false' ? false : undefined;
    return this.catalogService.getCatalog(typeof tipo === 'string' ? tipo.slice(0, 30) : undefined, destacadoBool);
  }

  // ── Endpoints admin (DEBEN ir antes de :slug para evitar conflictos) ──────

  @UseGuards(AdminKeyGuard)
  @Get('admin')
  async getAllAdmin() {
    return this.catalogService.getAllProducts();
  }

  @UseGuards(AdminKeyGuard)
  @Post('admin')
  async createProduct(
    @Body() dto: CreateProductDto,
  ) {
    return this.catalogService.createProduct(dto);
  }

  @UseGuards(AdminKeyGuard)
  @Put('admin/:id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(BigInt(id), dto);
  }

  @UseGuards(AdminKeyGuard)
  @Patch('admin/:id/toggle')
  @HttpCode(200)
  async toggleProduct(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.catalogService.toggleProduct(BigInt(id));
  }

  @UseGuards(AdminKeyGuard)
  @Delete('admin/:id')
  @HttpCode(200)
  async deleteProduct(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.catalogService.deleteProduct(BigInt(id));
  }

  // ── Ruta por slug (debe ir al final para no capturar rutas admin) ─────────

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    if (typeof slug !== 'string' || slug.length > 200) throw new NotFoundException('Producto no encontrado');
    const product = await this.catalogService.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }
}
