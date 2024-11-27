// consultation-records.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ConsultationRecordsService {
  constructor(private prisma: PrismaService) {}

  // Method to create a consultation record
  async createConsultationRecord(data: {
    client_id: number;
    admin_id: number;
    date: Date;
    patient_name: string;
    patient_occupation: string;
    doctor: string;
    complaint: string;
    remarks: string;
    confined: boolean;
    medAdministration: boolean;
  }) {
    try {
      const consultationRecord = await this.prisma.consultation_records.create({
        data,
      });
      return consultationRecord;
    } catch (error) {
      throw new Error(`Error creating consultation record: ${error.message}`);
    }
  }

  // Method to update a consultation record
  async updateConsultationRecord(
    consultation_id: number,
    data: {
      client_id: number;
      admin_id: number;
      date: Date;
      patient_name: string;
      patient_occupation: string;
      doctor: string;
      complaint: string;
      remarks: string;
      confined: boolean;
      medAdministration: boolean;
    },
  ) {
    try {
      const consultationRecord = await this.prisma.consultation_records.update({
        where: { consultation_id },
        data,
      });
      return consultationRecord;
    } catch (error) {
      throw new Error(`Error updating consultation record: ${error.message}`);
    }
  }

  // Method to fetch all consultation records
  async getConsultationRecords() {
    try {
      const consultationRecords = await this.prisma.consultation_records.findMany();
      return consultationRecords;
    } catch (error) {
      throw new Error(`Error fetching consultation records: ${error.message}`);
    }
  }

  // Method to fetch a single consultation record
  async getConsultationRecord(consultation_id: number) {
    try {
      const consultationRecord = await this.prisma.consultation_records.findUnique({
        where: { consultation_id },
      });
      if (!consultationRecord) {
        throw new Error(`Consultation record with ID ${consultation_id} not found`);
      }
      return consultationRecord;
    } catch (error) {
      throw new Error(`Error fetching consultation record: ${error.message}`);
    }
  }
  async countConsultationRecords() {
    try {
      const count = await this.prisma.consultation_records.count();
      return count;

    } catch (error) {
      throw new Error(`Error counting consultation records: ${error.message}`);
    }
  }
  async deleteConsultationRecord(consultation_id: number) {
    try {
      await this.prisma.consultation_records.delete({
        where: { consultation_id },
      });
    } catch (error) {
      throw new Error(`Error deleting consultation record: ${error.message}`);
    }
  }
}