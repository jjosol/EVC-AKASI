import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException, Request, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Get()
  async getAllItems() {
    return this.inventoryService.getAllItems();
  }

  @Post()
  async addItem(@Body() item: any, @Request() req) {
    // Extract admin_id from request if available (through auth)
    const admin_id = req.user?.admin_id;
    return this.inventoryService.addItem(item, admin_id);
  }
  @Post('category')
  async addCategory(@Body() data: { name: string }, @Request() req) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.addCategory(data, admin_id);
  }

  @Put('category/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() data: { name: string },
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.updateCategory(Number(id), data.name, admin_id);
  }
  @Put('reduce/:med_id/:medName')
  async reduceInventory(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string,
    @Body() data: { quantity: number, cause?: string },
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.reduceInventory(
      Number(med_id), 
      medName, 
      data.quantity,
      data.cause || 'Manual reduction',
      admin_id
    );
  }

  @Post('increase/:med_id')
  async increaseInventory(
    @Param('med_id') med_id: string,
    @Body() data: { medName: string, quantity: number, cause?: string },
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.increaseInventory(
      Number(med_id), 
      data.medName, 
      data.quantity,
      data.cause || 'Manual addition',
      admin_id
    );
  }

  @Put('medicine/update-name')
  async updateMedicineName(
    @Body() data: { oldName: string, newName: string, categoryId: number },
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.updateMedicineName(
      data.oldName,
      data.newName,
      data.categoryId,
      admin_id
    );
  }

  @Put(':med_id/:medName')
  async updateItem(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string,
    @Body() data: any,
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.updateItem(Number(med_id), medName, data, admin_id);
  }

  @Delete('group/:medName')
  async deleteGroupByName(@Param('medName') medName: string, @Request() req) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.deleteGroupByName(medName, admin_id);
  }

  @Delete('category/:id')
  async deleteCategory(@Param('id') id: string, @Request() req) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.deleteCategory(Number(id), admin_id);
  }

  @Delete(':med_id/:medName')
  async deleteItem(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string,
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.deleteItem(Number(med_id), medName, admin_id);
  }

  @Get('categories')
  async getAllCategories() {
    return this.inventoryService.getAllCategories();
  }

 

  @Get('edits')
  async getInventoryEdits(@Request() req) {
    const admin_id = req.user?.admin_id;
    return this.inventoryService.getInventoryEdits(admin_id);
  }

 
}