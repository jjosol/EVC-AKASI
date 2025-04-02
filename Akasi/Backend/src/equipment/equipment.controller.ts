import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('equipment')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  async getAllItems() {
    return this.equipmentService.getAllItems();
  }

  @Post()
  async addItem(@Body() item: any, @Request() req) {
    const admin_id = req.user?.admin_id;
    return this.equipmentService.addItem(item, admin_id);
  }

  @Put(':id')
  async updateItem(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.equipmentService.updateItem(Number(id), data, admin_id);
  }

  @Delete(':id')
  async deleteItem(@Param('id') id: string, @Request() req) {
    const admin_id = req.user?.admin_id;
    return this.equipmentService.deleteItem(Number(id), admin_id);
  }

  @Post('/increase/:id')
  async increaseEquipment(
    @Param('id') id: string,
    @Body() data: { quantity: number, cause?: string },
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.equipmentService.increaseEquipment(
      Number(id), 
      data.quantity,
      data.cause || 'Manual addition',
      admin_id
    );
  }

  @Post('/decrease/:id')
  async decreaseEquipment(
    @Param('id') id: string,
    @Body() data: { quantity: number, cause?: string },
    @Request() req
  ) {
    const admin_id = req.user?.admin_id;
    return this.equipmentService.decreaseEquipment(
      Number(id), 
      data.quantity,
      data.cause || 'Manual reduction',
      admin_id
    );
  }

  @Get('/edits')
  async getEquipmentEdits() {
    // Remove the admin_id parameter since the service doesn't use it
    return this.equipmentService.getEquipmentEdits();
  }
}

