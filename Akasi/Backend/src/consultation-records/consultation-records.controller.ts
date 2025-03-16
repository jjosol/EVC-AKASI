// consultation-records.controller.ts
import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { ConsultationRecordsService } from './consultation-records.service';

@Controller('consultation-records')
export class ConsultationRecordsController {
  constructor(private readonly service: ConsultationRecordsService) {}

  // POST request to create a consultation record
  @Post()
  async createConsultationRecord(@Body() body: any) {
    try {
      console.log('Received POST request body:', body); // Debug log

      // Validate required fields
      if (!body.client_id || !body.patient_name) {
        throw new BadRequestException('Missing required fields');
      }

      const consultationRecord = await this.service.createConsultationRecord({
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

      return consultationRecord;
    } catch (error) {
      console.error('Create consultation error:', error);
      throw new BadRequestException(error.message);
    }
  }
  // PUT request to update a consultation record

  @Put(':id')
  async updateConsultationRecord(
    @Param('id', ParseIntPipe) consultation_id: number,
    @Body() body: any,
  ) {
    try {
      // Validate required fields
      if (!body.client_id || !body.patient_name) {
        throw new BadRequestException('Missing required fields');
      }

      const existingRecord = await this.service.getConsultationRecord(consultation_id);
      if (!existingRecord) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }

      // Ensure proper type conversion
      const updateData = {
        clientId: Number(body.client_id),
        name: String(body.patient_name),
        occupation: String(body.patient_occupation),
        generalComplaint: String(body.complaint || ''),
        remarks: String(body.remarks || ''),
        confined: Boolean(body.confined),
        medicationAdministration: Boolean(body.medAdministration),
      };

      return await this.service.updateConsultationRecord(consultation_id, updateData);
    } catch (error) {
      console.error('Update consultation error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  // GET request to retrieve consultation records
  @Get()
  async getConsultationRecords() {
    try {
      return await this.service.getConsultationRecords();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('count')
  async getConsultationRecordsCount(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('confined') confined?: string,
  ) {
    const confinedBool = confined === 'true' ? true : confined === 'false' ? false : undefined;
    return this.service.countConsultationRecordsByMonth(year, month, confinedBool);
  }

  @Get('total-count')
  async getTotalConsultationCount() {
    return this.service.getTotalConsultationCount();
  }

  @Get('year-count')
  async getConsultationRecordsCountByYear(@Query('year', ParseIntPipe) year: number) {
    return this.service.getConsultationRecordsCountByYear(year);
  }

  // GET request to retrieve a single consultation record
  @Get(':id')
  async getConsultationRecord(@Param('id', ParseIntPipe) consultation_id: number) {
    try {
      const record = await this.service.getConsultationRecord(consultation_id);
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

      const existingRecord = await this.service.getConsultationRecord(consultation_id);
      if (!existingRecord) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }

      await this.service.deleteConsultationRecord(consultation_id);
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
