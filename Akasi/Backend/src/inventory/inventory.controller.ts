import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException } from '@nestjs/common';
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

  @Put('reduce/:med_id')
  async reduceInventory(
    @Param('med_id') med_id: string,
    @Body() data: { quantity: number }
  ) {
    console.log('Received request to reduce inventory:', { med_id, data });

    if (!data.quantity || isNaN(data.quantity) || data.quantity <= 0) {
      throw new BadRequestException('Invalid quantity');
    }

    return this.inventoryService.reduceInventory(Number(med_id), data.quantity);
  }

  @Put(':id/:name')
  async updateItem(
    @Param('id') id: string,
    @Param('name') name: string,
    @Body() data: any
  ) {
    return this.inventoryService.updateItem(Number(id), name, data);
  }

  @Delete('group/:name')
  async deleteGroupByName(@Param('name') name: string) {
    return this.inventoryService.deleteGroupByName(name);
  }

  @Delete(':id/:name')
  async deleteItem(
    @Param('id') id: string,
    @Param('name') name: string
  ) {
    return this.inventoryService.deleteItem(Number(id), name);
  }
}