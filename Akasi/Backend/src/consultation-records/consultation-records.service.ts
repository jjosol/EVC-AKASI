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
    person: {
      clientId: number;
      name: string;
      occupation?: string;
      grade?: string;
      section?: string;
      generalComplaint?: string;
      remarks?: string;
      confined?: boolean;
      medicationAdministration?: boolean;
    },
  ) {
    try {
      // First, fetch the existing record to get the original date
      const existingRecord = await this.getConsultationRecord(consultation_id);

      // Prepare update data with proper type conversions
      const updateData = {
        client_id: person.clientId,
        admin_id: 1, // Replace with actual admin_id
        date: new Date(existingRecord.date).toISOString(), // Ensure proper date format
        patient_name: person.name,
        patient_occupation: person.occupation || `${person.grade}-${person.section}`,
        doctor: 'John Doe',
        complaint: person.generalComplaint || '',
        remarks: person.remarks || '',
        confined: Boolean(person.confined),
        medAdministration: Boolean(person.medicationAdministration)
      };

      const consultationRecord = await this.prisma.consultation_records.update({
        where: { consultation_id },
        data: updateData,
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

  async countConsultationRecordsByMonth(year: number, month: number, confined?: boolean) {
    try {
      const whereCondition: any = {
        date: {
          gte: new Date(year, month, 1),
          lt: new Date(year, month + 1, 1),
        },
      };

      if (confined !== undefined) {
        whereCondition.confined = confined;
      }

      const count = await this.prisma.consultation_records.count({
        where: whereCondition,
      });
      return count;
    } catch (error) {
      throw new Error(`Error counting consultation records: ${error.message}`);
    }
  }

  async getTotalConsultationCount(): Promise<number> {
    try {
      return await this.prisma.consultation_records.count();
    } catch (error) {
      throw new Error(`Error getting total consultation count: ${error.message}`);
    }
  }

  async getConsultationRecordsCountByYear(year: number): Promise<number> {
    try {
      const startDate = new Date(year, 0, 1); // January 1st of the year
      const endDate = new Date(year + 1, 0, 1); // January 1st of the next year

      const count = await this.prisma.consultation_records.count({
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      });
      return count;
    } catch (error) {
      throw new Error(`Error getting consultation records count by year: ${error.message}`);
    }
  }

  async deleteConsultationRecord(consultation_id: number) {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        // First, get all medicine administration records
        const medAdminRecords = await prisma.medAdministration.findMany({
          where: { consultation_id }
        });

        // Return quantities to inventory
        for (const record of medAdminRecords) {
          await prisma.inventory.update({
            where: {
              med_id_medName: {
                med_id: record.med_id,
                medName: record.medName
              }
            },
            data: {
              count: {
                increment: record.count // Return quantities to inventory
              }
            }
          });
        }

        // Delete all medicine administration records
        await prisma.medAdministration.deleteMany({
          where: { consultation_id }
        });

        // Finally delete the consultation record
        return await prisma.consultation_records.delete({
          where: { consultation_id }
        });
      } catch (error) {
        throw new Error(`Error deleting consultation record: ${error.message}`);
      }
    });
  }
}