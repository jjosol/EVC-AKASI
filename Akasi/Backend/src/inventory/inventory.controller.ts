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

  @Put('reduce/:med_id/:medName')
  async reduceInventory(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string,
    @Body() data: { quantity: number }
  ) {
    return this.inventoryService.reduceInventory(Number(med_id), medName, data.quantity);
  }

  @Post('increase/:med_id')
  async increaseInventory(
    @Param('med_id') med_id: string,
    @Body() data: { medName: string, quantity: number }
  ) {
    return this.inventoryService.increaseInventory(Number(med_id), data.medName, data.quantity);
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