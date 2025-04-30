import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async getPatients() {
    try {
      return await this.prisma.patient.findMany({
        select: {
          patient_id: true,
          name: true,
          gmail: true,
          age: true,
          gender: true,
          type: true,
          grade: true,
          section: true,
          category: true,
          status: true,
          civil_status: true,
          address: true,
          division: true,
          position: true
        }
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch patients: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPatientById(id: number) {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { patient_id: id },
        select: {
          patient_id: true,
          name: true,
          gmail: true,
          age: true,
          gender: true,
          type: true,
          grade: true,
          section: true,
          category: true,
          status: true,
          civil_status: true,
          address: true,
          division: true,
          position: true
        }
      });

      if (!patient) {
        throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
      }

      return patient;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch patient: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createPatient(data: any) {
    try {
      // Check if username or email already exists
      const existingPatient = await this.prisma.patient.findFirst({
        where: {
          OR: [
            { username: data.username },
            { gmail: data.gmail }
          ]
        }
      });

      if (existingPatient) {
        throw new HttpException(
          'Username or email already exists',
          HttpStatus.BAD_REQUEST
        );
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      return await this.prisma.patient.create({
        data: {
          username: data.username,
          password: hashedPassword, // Using hashed password
          name: data.name,
          gmail: data.gmail,
          age: data.age,
          gender: data.gender,
          type: data.type,
          civil_status: data.civil_status,
          address: data.address,
          division: data.division || null,
          position: data.position || null,
          grade: data.grade || null,
          section: data.section || null,
          category: data.category || null,
          status: 'pending' // Default status for new patients
        }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create patient: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updatePatient(id: number, data: any) {
    try {
      // Check if patient exists
      const patient = await this.prisma.patient.findUnique({
        where: { patient_id: id }
      });

      if (!patient) {
        throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
      }

      // If username or email is changing, check if new values are already taken
      if (data.username !== patient.username || data.gmail !== patient.gmail) {
        const existingPatient = await this.prisma.patient.findFirst({
          where: {
            OR: [
              { username: data.username },
              { gmail: data.gmail }
            ],
            NOT: {
              patient_id: id
            }
          }
        });

        if (existingPatient) {
          throw new HttpException(
            'Username or email already in use by another patient',
            HttpStatus.BAD_REQUEST
          );
        }
      }

      // Prepare update data
      const updateData: any = {
        username: data.username,
        name: data.name,
        gmail: data.gmail,
        age: data.age,
        gender: data.gender,
        type: data.type,
        civil_status: data.civil_status,
        address: data.address,
        division: data.division,
        position: data.position,
        grade: data.grade,
        section: data.section,
        category: data.category,
      };

      // If password is provided, hash it
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      return await this.prisma.patient.update({
        where: { patient_id: id },
        data: updateData
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update patient: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deletePatient(id: number) {
    try {
      // Check if patient exists
      const patient = await this.prisma.patient.findUnique({
        where: { patient_id: id }
      });

      if (!patient) {
        throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
      }

      // Check if patient has related records
      const hasRelatedRecords = await this.checkPatientRelations(id);
      
      if (hasRelatedRecords) {
        throw new HttpException(
          'Cannot delete patient with related records',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.prisma.patient.delete({
        where: { patient_id: id }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete patient: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Helper method to check if a patient has related records
  private async checkPatientRelations(patientId: number): Promise<boolean> {
    const [
      consultations,
      appointments,
      medAdministrations,
      dentalCertificates,
      medicalCertificates,
      opthalCertificates,
      physicalExams,
      dentalConsents,
      medicalConsents,
      dentalHistories,
      hhPds,
      laboratoryRecords
    ] = await Promise.all([
      this.prisma.consultation_records.count({
        where: { patient_id: patientId }
      }),
      this.prisma.appointment.count({
        where: { patient_id: patientId }
      }),
      this.prisma.medAdministration.count({
        where: { patient_id: patientId }
      }),
      this.prisma.dental_certificates.count({
        where: { patient_id: patientId }
      }),
      this.prisma.medical_certificates.count({
        where: { patient_id: patientId }
      }),
      this.prisma.opthal_certificates.count({
        where: { patient_id: patientId }
      }),
      this.prisma.physical_exam.count({
        where: { patient_id: patientId }
      }),
      this.prisma.dental_consent.count({
        where: { patient_id: patientId }
      }),
      this.prisma.medical_consent.count({
        where: { patient_id: patientId }
      }),
      this.prisma.dental_history.count({
        where: { patient_id: patientId }
      }),
      this.prisma.hh_pds.count({
        where: { patient_id: patientId }
      }),
      this.prisma.laboratory.count({
        where: { patient_id: patientId }
      })
    ]);

    return (
      consultations > 0 ||
      appointments > 0 ||
      medAdministrations > 0 ||
      dentalCertificates > 0 ||
      medicalCertificates > 0 ||
      opthalCertificates > 0 ||
      physicalExams > 0 ||
      dentalConsents > 0 ||
      medicalConsents > 0 ||
      dentalHistories > 0 ||
      hhPds > 0 ||
      laboratoryRecords > 0
    );
  }
}