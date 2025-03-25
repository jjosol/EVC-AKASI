// consultation-records.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ConsultationRecordsService {
  constructor(private prisma: PrismaService) {}

  // Method to create a consultation record
  async createConsultationRecord(data: any) {
    try {
      const { diagnosis_ids, ...consultationData } = data;
      
      // Create the consultation record first
      const record = await this.prisma.consultation_records.create({
        data: consultationData
      });
      
      // If diagnosis_ids are provided, link them to the consultation
      if (diagnosis_ids && Array.isArray(diagnosis_ids) && diagnosis_ids.length > 0) {
        for (const diagnosis_id of diagnosis_ids) {
          await this.linkDiagnosisToConsultation(record.consultation_id, diagnosis_id);
        }
      }
      
      // Return the created record with the diagnoses included
      return this.getConsultationRecord(record.consultation_id);
    } catch (error) {
      throw new BadRequestException(`Failed to create consultation record: ${error.message}`);
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
      action?: string;         // Add this field
      disposition?: string;    // Add this field
      confined?: boolean;
      medicationAdministration?: boolean;
      intern?: boolean;
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
        action: person.action || '',      // Add this field
        disposition: person.disposition || '', // Add this field
        confined: Boolean(person.confined),
        medAdministration: Boolean(person.medicationAdministration),
        intern: Boolean(person.intern),
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
      const record = await this.prisma.consultation_records.findUnique({
        where: { consultation_id },
        include: {
          diagnoses: {
            include: {
              diagnosis: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      if (!record) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }

      return record;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch consultation record: ${error.message}`);
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

  async linkDiagnosisToConsultation(consultation_id: number, diagnosis_id: number) {
    try {
      // Check if consultation exists
      const consultation = await this.prisma.consultation_records.findUnique({
        where: { consultation_id }
      });

      if (!consultation) {
        throw new NotFoundException(`Consultation with ID ${consultation_id} not found`);
      }

      // Check if diagnosis exists
      const diagnosis = await this.prisma.diagnosis.findUnique({
        where: { diagnosis_id }
      });

      if (!diagnosis) {
        throw new NotFoundException(`Diagnosis with ID ${diagnosis_id} not found`);
      }

      // Check if link already exists
      const existingLink = await this.prisma.consultation_diagnosis.findUnique({
        where: {
          consultation_id_diagnosis_id: {
            consultation_id,
            diagnosis_id
          }
        }
      });

      if (existingLink) {
        // If it already exists, just return success
        return { message: 'Diagnosis already linked to consultation' };
      }

      // Create link
      await this.prisma.consultation_diagnosis.create({
        data: {
          consultation_id,
          diagnosis_id
        }
      });

      return { message: 'Diagnosis linked to consultation successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to link diagnosis to consultation: ${error.message}`);
    }
  }

  async removeDiagnosisFromConsultation(consultation_id: number, diagnosis_id: number) {
    try {
      // Check if link exists
      const existingLink = await this.prisma.consultation_diagnosis.findUnique({
        where: {
          consultation_id_diagnosis_id: {
            consultation_id,
            diagnosis_id
          }
        }
      });

      if (!existingLink) {
        throw new NotFoundException('Diagnosis is not linked to this consultation');
      }

      // Delete link
      await this.prisma.consultation_diagnosis.delete({
        where: {
          consultation_id_diagnosis_id: {
            consultation_id,
            diagnosis_id
          }
        }
      });

      return { message: 'Diagnosis removed from consultation successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove diagnosis from consultation: ${error.message}`);
    }
  }
}