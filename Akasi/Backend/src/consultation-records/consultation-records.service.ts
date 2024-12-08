// consultation-records.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';  // Add this import

@Injectable()
export class ConsultationRecordsService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
  ) {}

  // Method to create a consultation record
  async createConsultationRecord(data: any) {
    try {
      const consultation = await this.prisma.consultation_records.create({
        data: {
          client_id: data.client_id,
          admin_id: data.admin_id,
          date: new Date(data.date),
          patient_name: data.patient_name,
          patient_occupation: data.patient_occupation,
          doctor: data.doctor,
          complaint: data.complaint,
          remarks: data.remarks,
          confined: data.confined,
          medAdministration: data.medAdministration,
        },
      });

      return consultation;
    } catch (error) {
      throw new BadRequestException('Failed to create consultation record');
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
  async countConsultationRecordsByMonth(year: number, month: number) {
    try {
      const count = await this.prisma.consultation_records.count({
        where: {
          date: {
            gte: new Date(year, month, 1),
            lt: new Date(year, month + 1, 1),
          },
        },
      });
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