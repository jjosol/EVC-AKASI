// consultation-records.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConsultationRecordCreateInput, ConsultationRecordUpdateInput, ConsultationRecordResponse } from './consultation-records.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConsultationRecordsService {
  constructor(private prisma: PrismaService) { }

  // Helper method to update diagnoses_text field
  private async updateDiagnosesText(consultation_id: number): Promise<void> {
    try {
      // Get all diagnoses for this consultation
      const consultationWithDiagnoses = await this.prisma.consultation_records.findUnique({
        where: { consultation_id },
        include: {
          diagnosis: {
            include: {
              diagnosis: true
            }
          }
        }
      });

      if (!consultationWithDiagnoses) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }

      // Format diagnoses as a comma-separated string
      const diagnosesText = consultationWithDiagnoses.diagnosis
        .map(d => d.diagnosis?.name)
        .filter(Boolean)
        .join(', ');

      // Update the consultation record with formatted diagnoses
      await this.prisma.consultation_records.update({
        where: { consultation_id },
        data: { diagnosis_text: diagnosesText || null }
      });
    } catch (error) {
      console.error(`Error updating diagnoses_text: ${error.message}`);
      // Don't throw here to avoid disrupting main operations
    }
  }

  // Method to create a consultation record
  async createConsultationRecord(data: ConsultationRecordCreateInput) {
    try {
      const { diagnosis_ids, ...consultationData } = data;

      // Create the consultation record using the properly formatted data
      const record = await this.prisma.consultation_records.create({
        data: {
          patient_id: consultationData.patient_id,
          nurse_id: consultationData.nurse_id,
          doctor_id: consultationData.doctor_id || null,
          date: new Date(consultationData.date),
          patient_name: consultationData.patient_name,
          patient_occupation: consultationData.patient_occupation,
          nurse_name: consultationData.nurse_name,
          doctor_name: consultationData.doctor_name || null,
          complaint: consultationData.complaint || '',
          remarks: consultationData.remarks || '',
          confined: consultationData.confined || false,
          medAdministration: consultationData.medAdministration || false,
          intervention: consultationData.intervention || '',
          action: consultationData.action || '',
          disposition: consultationData.disposition || '',
        }
      });

      // Link diagnoses if provided
      if (diagnosis_ids && Array.isArray(diagnosis_ids) && diagnosis_ids.length > 0) {
        for (const diagnosis_id of diagnosis_ids) {
          await this.linkDiagnosisToConsultation(record.consultation_id, diagnosis_id);
        }
      }

      return this.getConsultationRecord(record.consultation_id);
    } catch (error) {
      throw new BadRequestException(`Failed to create consultation record: ${error.message}`);
    }
  }

  // Method to update a consultation record
  async updateConsultationRecord(
    consultation_id: number,
    data: ConsultationRecordUpdateInput,
  ) {
    try {
      const existingRecord = await this.getConsultationRecord(consultation_id);

      if (!existingRecord) {
        throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
      }

      const updateData = {
        patient_id: data.patient_id,
        nurse_id: data.nurse_id || existingRecord.nurse_id,
        doctor_id: data.doctor_id !== undefined ? data.doctor_id : existingRecord.doctor_id,
        date: existingRecord.date, // Maintain original date
        patient_name: data.patient_name,
        patient_occupation: data.patient_occupation || existingRecord.patient_occupation,
        nurse_name: data.nurse_name || existingRecord.nurse_name,
        doctor_name: data.doctor_name !== undefined ? data.doctor_name : existingRecord.doctor_name,
        complaint: data.complaint || existingRecord.complaint,
        remarks: data.remarks || existingRecord.remarks,
        action: data.action || existingRecord.action,
        disposition: data.disposition || existingRecord.disposition,
        intervention: data.intervention || existingRecord.intervention,
        confined: data.confined !== undefined ? data.confined : existingRecord.confined,
        medAdministration: data.medAdministration !== undefined ? data.medAdministration : existingRecord.medAdministration,
      };

      const consultationRecord = await this.prisma.consultation_records.update({
        where: { consultation_id },
        data: updateData,
      });
      
      // After updating the consultation, ensure the diagnoses_text is synchronized
      await this.updateDiagnosesText(consultation_id);

      return this.getConsultationRecord(consultation_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
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
          diagnosis: {
            include: {
              diagnosis: {
                include: {
                  category: true
                }
              }
            }
          },
          nurse: true,
          doctor: true,
          medAdministrations: true
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
          // Get the current medicine item
          const medicineItem = await prisma.medicine.findUnique({
            where: {
              medicine_id_medName: {
                medicine_id: record.med_id,
                medName: record.medName
              }
            }
          });

          if (!medicineItem) {
            continue; // Skip if medicine doesn't exist anymore
          }

          // Update the medicine count
          const updatedItem = await prisma.medicine.update({
            where: {
              medicine_id_medName: {
                medicine_id: record.med_id,
                medName: record.medName
              }
            },
            data: {
              count: {
                increment: record.count // Return quantities to inventory
              }
            }
          });

          // Calculate new running total
          const newTotal = medicineItem.count + record.count;

          // Log the return to inventory - Changed EditsMedicine to editsMedicine (camelCase)
          await prisma.editsMedicine.create({
            data: {
              med_id: record.med_id,
              medName: record.medName,
              date: new Date(),
              cause: `Returned to inventory (Consultation #${consultation_id} deleted)`,
              addSubCount: record.count, // Positive for return
              runningTotal: newTotal, // Add the running total
              category_id: medicineItem.medCategory_id, // Add the category ID
              nurse_id: 1 // Assuming system action - replace with actual nurse ID if available
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
      
      // Update diagnoses_text field
      await this.updateDiagnosesText(consultation_id);

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
      
      // Update diagnoses_text field
      await this.updateDiagnosesText(consultation_id);

      return { message: 'Diagnosis removed from consultation successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove diagnosis from consultation: ${error.message}`);
    }
  }

  /**
   * Get consultation records for a specific patient
   */
  async getPatientConsultations(patientId: number) {
    try {
      const patientIdInt = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;

      const consultations = await this.prisma.consultation_records.findMany({
        where: {
          patient_id: patientIdInt,
        },
        include: {
          diagnosis: {
            include: {
              diagnosis: true
            }
          },
          nurse: true,
          doctor: true,
          medAdministrations: true
        },
        orderBy: {
          date: 'desc',
        },
      });

      return consultations.map(record => ({
        id: record.consultation_id,
        date: record.date,
        nurse_name: record.nurse_name,
        doctor_name: record.doctor_name,
        complaint: record.complaint,
        remarks: record.remarks,
        action: record.action,
        disposition: record.disposition,
        intervention: record.intervention,
        confined: record.confined,
        medAdministration: record.medAdministration,
        // Use diagnoses_text if available, otherwise generate it from relations
        diagnoses: record.diagnosis_text || 
                   record.diagnosis?.map(d => d.diagnosis?.name).filter(Boolean).join(', ') || 
                   record.complaint,
        // Include medication administration details
        medications: record.medAdministrations?.map(med => ({
          id: med.med_administration_id,
          name: med.medName,
          count: med.count,
          schedule: med.schedule,
          startDate: med.start_date,
          endDate: med.end_date,
          remarks: med.remarks
        })) || [],
        nurseName: record.nurse?.name || 'Unknown',
        doctorName: record.doctor?.name || null
      }));
    } catch (error) {
      console.error('Error fetching patient consultations:', error);
      throw new Error('Failed to fetch consultation records');
    }
  }

  // Alias method for backward compatibility
  async getClientConsultations(clientId: number) {
    return this.getPatientConsultations(clientId);
  }
}