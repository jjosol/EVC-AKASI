import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getAllItems() {
    return this.inventoryService.getAllItems();
  }

  @Post()
  async addItem(@Body() item: any) {
    return this.inventoryService.addItem(item);
  }

  @Put(':id/:name')
  async updateItem(
    @Param('id') id: string,
    @Param('name') name: string,
    @Body() data: any
  ) {
    return this.inventoryService.updateItem(Number(id), name, data);
  }

  @Delete(':id/:name')
  async deleteItem(
    @Param('id') id: string,
    @Param('name') name: string
  ) {
    return this.inventoryService.deleteItem(Number(id), name);
  }
}
