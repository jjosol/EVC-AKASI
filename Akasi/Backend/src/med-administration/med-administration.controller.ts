// med-administration.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException, Request } from '@nestjs/common';
import { MedAdministrationService } from './med-administration.service';

@Controller('med-administration')
export class MedAdministrationController {
  constructor(private service: MedAdministrationService) { }

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
  async update(@Param('id') id: string, @Body() data: any, @Request() req) {
    // Get admin_id from the request if using JWT auth
    const admin_id = req.user?.admin_id;
    
    return this.service.updateMedAdministration(Number(id), {
      count: data.count,
      schedule: data.schedule,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      remarks: data.remarks
    }, admin_id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    try {
      // Pass admin_id if we want to track who deleted the record
      return await this.service.deleteMedAdministration(Number(id));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}