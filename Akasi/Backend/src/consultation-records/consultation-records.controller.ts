// consultation-records.controller.ts
import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query, ForbiddenException, Request } from '@nestjs/common';
import { ConsultationRecordsService } from './consultation-records.service';
import { ConsultationRecordCreateInput, ConsultationRecordUpdateInput } from './consultation-records.types';

@Controller('consultation-records')
export class ConsultationRecordsController {
  constructor(private readonly consultationRecordsService: ConsultationRecordsService) { }

  // POST request to create a consultation record
  @Post()
  async createConsultationRecord(@Body() body: any) {
    try {
      console.log('Received POST request body:', body); // Debug log

      // Validate required fields
      if (!body.client_id || !body.patient_name) {
        throw new BadRequestException('Missing required fields');
      }

      const consultationRecord = await this.consultationRecordsService.createConsultationRecord({
        client_id: Number(body.client_id),
        admin_id: Number(body.admin_id),
        date: new Date(body.date),
        patient_name: String(body.patient_name),
        patient_occupation: String(body.patient_occupation),
        doctor: String(body.doctor),
        complaint: String(body.complaint || ''),
        remarks: String(body.remarks || ''),
        action: String(body.action || ''),           // Add this field
        disposition: String(body.disposition || ''), // Add this field
        intern: Boolean(body.intern),
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

      const existingRecord = await this.consultationRecordsService.getConsultationRecord(consultation_id);
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
        action: String(body.action || ''),           // Add this field
        disposition: String(body.disposition || ''), // Add this field
        intern: Boolean(body.intern),
        confined: Boolean(body.confined),
        medicationAdministration: Boolean(body.medAdministration),
      };

      return await this.consultationRecordsService.updateConsultationRecord(consultation_id, updateData);
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
      return await this.consultationRecordsService.getConsultationRecords();
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
    return this.consultationRecordsService.countConsultationRecordsByMonth(year, month, confinedBool);
  }

  @Get('total-count')
  async getTotalConsultationCount() {
    return this.consultationRecordsService.getTotalConsultationCount();
  }

  @Get('year-count')
  async getConsultationRecordsCountByYear(@Query('year', ParseIntPipe) year: number) {
    return this.consultationRecordsService.getConsultationRecordsCountByYear(year);
  }

  // GET request to retrieve a single consultation record
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

  // Link diagnosis to consultation
  @Post(':id/diagnoses')
  async linkDiagnosisToConsultation(
    @Param('id', ParseIntPipe) consultation_id: number,
    @Body() data: { diagnosis_id: number }
  ) {
    return this.consultationRecordsService.linkDiagnosisToConsultation(
      consultation_id,
      data.diagnosis_id
    );
  }

  // Remove diagnosis from consultation
  @Delete(':id/diagnoses/:diagnosisId')
  async removeDiagnosisFromConsultation(
    @Param('id', ParseIntPipe) consultation_id: number,
    @Param('diagnosisId', ParseIntPipe) diagnosis_id: number
  ) {
    return this.consultationRecordsService.removeDiagnosisFromConsultation(
      consultation_id,
      diagnosis_id
    );
  }

  @Get('client/:clientId')
  async getClientConsultations(
    @Param('clientId') clientId: string,
    @Request() req
  ) {
    console.log(`Getting consultations for client ID: ${clientId}`);
    try {
      // Convert clientId to number
      const clientIdNum = parseInt(clientId, 10);

      if (isNaN(clientIdNum)) {
        throw new BadRequestException('Invalid client ID');
      }

      console.log(`Converted client ID to number: ${clientIdNum}`);

      const consultations = await this.consultationRecordsService.getClientConsultations(clientIdNum);
      console.log(`Found ${consultations.length} consultations for client ${clientIdNum}`);

      return consultations;
    } catch (error) {
      console.error(`Error in getClientConsultations: ${error.message}`);
      throw error;
    }
  }
}
