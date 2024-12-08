import { Controller, Post, Get, Body, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { MedAdministrationService } from './med-administration.service';

@Controller('med-administration')
export class MedAdministrationController {
  constructor(private readonly medAdminService: MedAdministrationService) {}

  @Post()
  async create(@Body() data: any) {
    try {
      return await this.medAdminService.create({
        ...data,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date)
      });
    } catch (error) {
      console.error('Error in create method:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Get('consultation/:id')
  findByConsultation(@Param('id', ParseIntPipe) consultation_id: number) {
    return this.medAdminService.findByConsultation(consultation_id);
  }
}
