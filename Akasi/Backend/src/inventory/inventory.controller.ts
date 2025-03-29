import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

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
    @Body('quantity') quantity: number  // now accepting quantity directly from the body
  ) {
    return this.inventoryService.reduceInventory(Number(med_id), medName, quantity);
  }

  @Post('increase/:med_id')
  async increaseInventory(
    @Param('med_id') med_id: string,
    @Body() data: { medName: string, quantity: number }
  ) {
    return this.inventoryService.increaseInventory(Number(med_id), data.medName, data.quantity);
  }

  // Changed route parameters for consistency: use med_id and medName
  @Put(':med_id/:medName')
  async updateItem(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string,
    @Body() data: any
  ) {
    return this.inventoryService.updateItem(Number(med_id), medName, data);
  }

  @Delete('group/:medName')
  async deleteGroupByName(@Param('medName') medName: string) {
    return this.inventoryService.deleteGroupByName(medName);
  }

  // Specific route for deleting by category; keep before the generic delete route
  @Delete('category/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.inventoryService.deleteCategory(Number(id));
  }

  // Changed route parameters for consistency: use med_id and medName
  @Delete(':med_id/:medName')
  async deleteItem(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string
  ) {
    return this.inventoryService.deleteItem(Number(med_id), medName);
  }

  @Get('categories')
  async getAllCategories() {
    return this.inventoryService.getAllCategories();
  }

  @Post('category')
  async addCategory(@Body() data: { name: string }) {
    return this.inventoryService.addCategory(data);
  }

  @Put('category/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() data: { name: string }
  ) {
    return this.inventoryService.updateCategory(Number(id), data.name);
  }
}