// consultation-records.controller.ts
import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { ConsultationRecordsService } from './consultation-records.service';

@Controller('consultation-records')
export class ConsultationRecordsController {
  constructor(private readonly consultationRecordsService: ConsultationRecordsService) {}

  @Post()
  async createConsultationRecord(@Body() data: any) {
    try {
      return await this.consultationRecordsService.createConsultationRecord(data);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  async updateConsultationRecord(
    @Param('id', ParseIntPipe) consultation_id: number,
    @Body() body: any,
  ) {
    try {
      const existingRecord = await this.consultationRecordsService.getConsultationRecord(consultation_id);
      if (!existingRecord) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }

      return await this.consultationRecordsService.updateConsultationRecord(consultation_id, {
        client_id: Number(body.client_id),
        admin_id: Number(body.admin_id),
        date: new Date(body.date),
        patient_name: String(body.patient_name),
        patient_occupation: String(body.patient_occupation),
        doctor: String(body.doctor),
        complaint: String(body.complaint || ''),
        remarks: String(body.remarks || ''),
        confined: Boolean(body.confined),
        medAdministration: Boolean(body.medAdministration),
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  async getConsultationRecords() {
    try {
      return await this.consultationRecordsService.getConsultationRecords();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  
  @Get('count')
  async getConsultationRecordsCount(@Query('year', ParseIntPipe) year: number, @Query('month', ParseIntPipe) month: number) {
    try {
      return await this.consultationRecordsService.countConsultationRecordsByMonth(year, month);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  async getConsultationRecord(@Param('id', ParseIntPipe) consultation_id: number) {
    try {
      const record = await this.consultationRecordsService.getConsultationRecord(consultation_id);
      if (!record) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }
      return record;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
  
  @Delete(':id/delete')
  async deleteConsultationRecord(@Param('id', ParseIntPipe) consultation_id: number) {
    try {
      console.log(`Received DELETE request for ID: ${consultation_id}`); // Debug log

      const existingRecord = await this.consultationRecordsService.getConsultationRecord(consultation_id);
      if (!existingRecord) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }

      await this.consultationRecordsService.deleteConsultationRecord(consultation_id);
      return { message: `Consultation record with ID ${consultation_id} has been deleted` };
    } catch (error) {
      console.error('Delete consultation error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
