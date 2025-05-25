// consultation-records.controller.ts
import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query, ForbiddenException, Request, UseGuards } from '@nestjs/common';
import { ConsultationRecordsService } from './consultation-records.service';
import { ConsultationRecordCreateInput, ConsultationRecordUpdateInput } from './consultation-records.types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('consultation-records')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class ConsultationRecordsController {
  constructor(private readonly consultationRecordsService: ConsultationRecordsService) { }

  // POST request to create a consultation record
  @Post()
  async create(@Body() body: ConsultationRecordCreateInput) {
    try {
      return await this.consultationRecordsService.createConsultationRecord(body);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  // PUT request to update a consultation record
  @Put(':id')
  async updateConsultationRecord(
    @Param('id', ParseIntPipe) consultation_id: number,
    @Body() body: ConsultationRecordUpdateInput,
  ) {
    try {
      // Validate required fields
      if (!body.patient_id || !body.patient_name) {
        throw new BadRequestException('Missing required fields: patient_id and patient_name are required');
      }

      return await this.consultationRecordsService.updateConsultationRecord(consultation_id, body);
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

  // Standard DELETE endpoint following REST conventions
  @Delete(':id')
  async deleteConsultationRecordStandard(@Param('id', ParseIntPipe) consultation_id: number) {
    try {
      console.log(`Received standard DELETE request for ID: ${consultation_id}`);

      const existingRecord = await this.consultationRecordsService.getConsultationRecord(consultation_id);
      if (!existingRecord) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }

      await this.consultationRecordsService.deleteConsultationRecord(consultation_id);
      return { message: `Consultation record with ID ${consultation_id} has been deleted` };
    } catch (error) {
      console.error('Delete consultation error (standard endpoint):', error);
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

  @Get('patient/:patientId')
  async getPatientConsultations(
    @Param('patientId') patientId: string,
    @Request() req
  ) {
    console.log(`Getting consultations for patient ID: ${patientId}`);
    try {
      // Convert patientId to number
      const patientIdNum = parseInt(patientId, 10);

      if (isNaN(patientIdNum)) {
        throw new BadRequestException('Invalid patient ID');
      }

      console.log(`Converted patient ID to number: ${patientIdNum}`);

      const consultations = await this.consultationRecordsService.getPatientConsultations(patientIdNum);
      console.log(`Found ${consultations.length} consultations for patient ${patientIdNum}`);

      return consultations;
    } catch (error) {
      console.error(`Error in getPatientConsultations: ${error.message}`);
      throw error;
    }
  }

  // Keep the original endpoint for backward compatibility
  @Get('client/:clientId')
  async getClientConsultations(
    @Param('clientId') clientId: string,
    @Request() req
  ) {
    return this.getPatientConsultations(clientId, req);
  }

  // New endpoint to update medical data for a consultation
  @Put(':id/medical-data')
  async updateMedicalData(
    @Param('id', ParseIntPipe) consultation_id: number,
    @Body() medicalData: any
  ) {
    try {
      return await this.consultationRecordsService.updateMedicalData(consultation_id, medicalData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update medical data: ${error.message}`);
    }
  }

  // New endpoint to notify nurse about updated medical record
  @Post(':id/notify-nurse')
  async notifyNurseAboutMedicalRecord(
    @Param('id', ParseIntPipe) consultation_id: number,
    @Body() notificationData: any
  ) {
    try {
      return await this.consultationRecordsService.notifyNurseAboutMedicalRecord(consultation_id, notificationData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to notify nurse: ${error.message}`);
    }
  }
}
