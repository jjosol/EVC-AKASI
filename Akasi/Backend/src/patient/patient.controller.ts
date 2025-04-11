import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PatientService } from './patient.service';

// Define DTO to match the patient schema
class PatientDto {
  username: string;
  password: string;
  name: string;
  gmail: string;
  age: number;
  gender: string;
  type: string; // 'student', 'faculty', 'staff', 'other'
  civil_status: string; // 'single', 'married', 'widowed', 'separated'
  address: string;
  division?: string;
  position?: string; // 'student', 'faculty', 'staff', 'other'
  grade?: number;
  section?: string;
  category?: string; // 'Intern', 'Extern'
}

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  async getPatients() {
    try {
      const patients = await this.patientService.getPatients();
      return patients;
    } catch (error) {
      throw new HttpException(
        'Error fetching patients',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createPatient(@Body() patientData: PatientDto) {
    try {
      return await this.patientService.createPatient(patientData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error creating patient',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updatePatient(@Param('id') id: string, @Body() patientData: PatientDto) {
    try {
      return await this.patientService.updatePatient(parseInt(id), patientData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error updating patient',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deletePatient(@Param('id') id: string) {
    try {
      return await this.patientService.deletePatient(parseInt(id));
    } catch (error) {
      throw new HttpException(
        error.message || 'Error deleting patient',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}