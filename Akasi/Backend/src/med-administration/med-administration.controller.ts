// med-administration.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { MedAdministrationService } from './med-administration.service';

@Controller('med-administration')
export class MedAdministrationController {
  constructor(private service: MedAdministrationService) {}

  @Get('consultation/:id')
  async getByConsultation(@Param('id') id: string) {
    return this.service.getMedAdministrationByConsultation(Number(id));
  }

  @Post()
  async create(@Body() data: any) {
    try {
      if (
        !data.client_id ||
        !data.admin_id ||
        !data.med_id ||
        !data.medName ||
        !data.consultation_id
      ) {
        throw new BadRequestException('Missing required fields');
      }

      return this.service.createMedAdministration(data);
    } catch (error) {
      console.error('Error in MedAdministrationController.create:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.service.updateMedAdministration(Number(id), {
      count: data.count,
      schedule: data.schedule,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      remarks: data.remarks
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.service.deleteMedAdministration(Number(id));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}