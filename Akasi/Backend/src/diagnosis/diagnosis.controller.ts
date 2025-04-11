import { Controller, Get, Post, Put, Delete, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';

@Controller('diagnoses')
export class DiagnosisController {
    constructor(private readonly diagnosisService: DiagnosisService) {}

    @Get()
    async getAllDiagnoses(@Query('active') active?: string) {
        if (active === 'true') {
            return this.diagnosisService.getActiveDiagnoses();
        }
        return this.diagnosisService.getAllDiagnoses();
    }

    @Get(':id')
    async getDiagnosisById(@Param('id', ParseIntPipe) id: number) {
        return this.diagnosisService.getDiagnosisById(id);
    }

    @Post()
    async createDiagnosis(@Body() data: {
        name: string;
        category_id: number;
        created_by: number;
        active?: boolean;
    }) {
        return this.diagnosisService.createDiagnosis(data);
    }

    @Put(':id')
    async updateDiagnosis(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: {
            name?: string;
            category_id?: number;
            active?: boolean;
        }
    ) {
        return this.diagnosisService.updateDiagnosis(id, data);
    }

    @Patch(':id/toggle-status')
    async toggleDiagnosisStatus(@Param('id', ParseIntPipe) id: number) {
        return this.diagnosisService.toggleDiagnosisStatus(id);
    }

    @Delete(':id')
    async deleteDiagnosis(@Param('id', ParseIntPipe) id: number) {
        return this.diagnosisService.deleteDiagnosis(id);
    }

    @Get('categories/all')
    async getAllCategories() {
        return this.diagnosisService.getAllCategories();
    }

    @Post('categories')
    async createCategory(@Body() data: { name: string }) {
        return this.diagnosisService.createCategory(data);
    }

    @Put('categories/:id')
    async updateCategory(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { name: string }
    ) {
        return this.diagnosisService.updateCategory(id, data);
    }

    @Delete('categories/:id')
    async deleteCategory(@Param('id', ParseIntPipe) id: number) {
        return this.diagnosisService.deleteCategory(id);
    }

    @Post('cleanup-references')
    async cleanupInvalidDiagnosisReferences() {
        return this.diagnosisService.cleanupInvalidDiagnosisReferences();
    }
}
