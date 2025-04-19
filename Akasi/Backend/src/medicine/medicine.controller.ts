import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException, Request, UseGuards } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('medicine')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) { }

  @Get()
  async getAllItems() {
    return this.medicineService.getAllItems();
  }

  @Post()
  async addItem(@Body() item: any, @Request() req) {
    // Extract nurse_id from request if available (through auth)
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.addItem(item, nurse_id);
  }
  
  @Post('category')
  async addCategory(@Body() data: { name: string }, @Request() req) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.addCategory(data, nurse_id);
  }

  @Put('category/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() data: { name: string },
    @Request() req
  ) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.updateCategory(Number(id), data.name, nurse_id);
  }
  
  @Put('reduce/:med_id/:medName')
  async reduceInventory(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string,
    @Body() data: { quantity: number, cause?: string },
    @Request() req
  ) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.reduceInventory(
      Number(med_id), 
      medName, 
      data.quantity,
      data.cause || 'Manual reduction',
      nurse_id
    );
  }

  @Post('increase/:med_id')
  async increaseInventory(
    @Param('med_id') med_id: string,
    @Body() data: { medName: string, quantity: number, cause?: string },
    @Request() req
  ) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.increaseInventory(
      Number(med_id), 
      data.medName, 
      data.quantity,
      data.cause || 'Manual addition',
      nurse_id
    );
  }

  @Put('update-name')
  async updateMedicineName(
    @Body() data: { oldName: string, newName: string, categoryId: number },
    @Request() req
  ) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.updateMedicineName(
      data.oldName,
      data.newName,
      data.categoryId,
      nurse_id
    );
  }

  @Put(':med_id/:medName')
  async updateItem(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string,
    @Body() data: any,
    @Request() req
  ) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.updateItem(Number(med_id), medName, data, nurse_id);
  }

  @Delete('group/:medName')
  async deleteGroupByName(@Param('medName') medName: string, @Request() req) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.deleteGroupByName(medName, nurse_id);
  }

  @Delete('category/:id')
  async deleteCategory(@Param('id') id: string, @Request() req) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.deleteCategory(Number(id), nurse_id);
  }

  @Delete(':med_id/:medName')
  async deleteItem(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string,
    @Request() req
  ) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.deleteItem(Number(med_id), medName, nurse_id);
  }

  @Get('categories')
  async getAllCategories() {
    return this.medicineService.getAllCategories();
  }

  @Get(':med_id/:medName/otc')
  async getOtcStatus(
    @Param('med_id') med_id: string,
    @Param('medName') medName: string
  ) {
    return this.medicineService.getOtcStatus(Number(med_id), medName);
  }

  @Get('edits')
  async getMedicineEdits(@Request() req) {
    const nurse_id = req.user?.nurse_id;
    return this.medicineService.getInventoryEdits(nurse_id);
  }
}