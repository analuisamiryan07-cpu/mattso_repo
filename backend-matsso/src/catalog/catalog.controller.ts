import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async getCatalog(@Query('tipo') tipo?: string) {
    return this.catalogService.getCatalog(tipo);
  }

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.catalogService.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }
}
