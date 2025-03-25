import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';

@Controller('diagnosis')
export class DiagnosisController {
  constructor(private diagnosisService: DiagnosisService) {}

  // Get all categories - MUST come before the :id route
  @Get('categories')
  async getAllCategories() {
    return this.diagnosisService.getAllCategories();
  }

  // Get all diagnoses
  @Get()
  async getAllDiagnoses() {
    return this.diagnosisService.getAllDiagnoses();
  }

  // Get specific diagnosis by ID
  @Get(':id')
  async getDiagnosisById(@Param('id', ParseIntPipe) id: number) {
    try {
      const diagnosis = await this.diagnosisService.getDiagnosisById(id);
      return diagnosis;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch diagnosis: ${error.message}`);
    }
  }

  // Create new diagnosis
  @Post()
  async createDiagnosis(@Body() data: { 
    name: string; 
    category_id: number; 
    created_by: number 
  }) {
    return this.diagnosisService.createDiagnosis(data);
  }

  // Update diagnosis
  @Put(':id')
  async updateDiagnosis(
    @Param('id', ParseIntPipe) id: number, 
    @Body() data: {
      name?: string;
      category_id?: number;
    }
  ) {
    return this.diagnosisService.updateDiagnosis(id, data);
  }

  // Delete diagnosis
  @Delete(':id')
  async deleteDiagnosis(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosisService.deleteDiagnosis(id);
  }

  // Create new category
  @Post('categories')
  async createCategory(@Body() data: { name: string }) {
    return this.diagnosisService.createCategory(data);
  }

  // Update category
  @Put('categories/:id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { name: string }
  ) {
    return this.diagnosisService.updateCategory(id, data);
  }

  // Delete category
  @Delete('categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosisService.deleteCategory(id);
  }

  // Cleanup invalid diagnosis references
  @Post('cleanup')
  async cleanupInvalidReferences() {
    return this.diagnosisService.cleanupInvalidDiagnosisReferences();
  }
}
