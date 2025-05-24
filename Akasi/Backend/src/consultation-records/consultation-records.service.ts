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

      // Fetch the patient details to get their type, grade, and section
      const patientDetails = await this.prisma.patient.findUnique({
        where: { patient_id: consultationData.patient_id }
      });

      if (!patientDetails) {
        throw new NotFoundException(`Patient with ID ${consultationData.patient_id} not found`);
      }

      // Get the patient's details from the database
      const patientType = patientDetails.type || 'Unknown';
      const patientDivision = patientDetails.division || '';
      const patientCategory = patientDetails.category || '';
      const patientGrade = patientDetails.grade || null;
      const patientSection = patientDetails.section || null;
      const patientAge = patientDetails.age || null;
      const patientGender = patientDetails.gender || 'Unknown';

      // Set the category field based on patient type
      const displayCategory = patientType.toLowerCase() === 'student' 
        ? patientCategory // For students, show their category (Intern/Extern)
        : patientDivision; // For faculty/staff, show their division

      console.log(`Creating consultation for patient: ${consultationData.patient_name}, Type: ${patientType}, Category/Division: ${displayCategory}, Age: ${patientAge}, Gender: ${patientGender}, Grade: ${patientGrade}, Section: ${patientSection}`);

      // Create the consultation record using the properly formatted data
      const record = await this.prisma.consultation_records.create({
        data: {
          patient_id: consultationData.patient_id,
          nurse_id: consultationData.nurse_id,
          nurse_name: consultationData.nurse_name,
          date: new Date(consultationData.date),
          patient_name: consultationData.patient_name,
          patient_occupation: patientType, // Store the actual patient type
          complaint: consultationData.complaint || '',
          remarks: consultationData.remarks || '',
          confined: consultationData.confined || false,
          medAdministration: consultationData.medAdministration || false,
          intervention: consultationData.intervention || '',
          action: consultationData.action || '',
          disposition: consultationData.disposition || '',
          doctorShow: consultationData.doctorShow || false,
          // Store the patient's details in medical_data
          medical_data: {
            patientType,
            patientCategory: displayCategory, // Store the appropriate category/division
            patientGrade,
            patientSection,
            patientAge,
            patientGender,
            created_at: new Date().toISOString()
          }
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
        doctorShow: data.doctorShow !== undefined ? data.doctorShow : existingRecord.doctorShow,
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
          patient: {
            select: {
              type: true,
              division: true,
              category: true,
              age: true,
              gender: true,
              grade: true,
              section: true
            }
          },
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

      // Determine the display category based on patient type
      const displayCategory = record.patient?.type?.toLowerCase() === 'student'
        ? record.patient.category // For students, show their category (Intern/Extern)
        : record.patient.division; // For faculty/staff, show their division

      // Include patient information in the medical_data
      const medical_data = {
        ...(typeof record.medical_data === 'object' ? record.medical_data : {}),
        patientType: record.patient?.type || null,
        patientCategory: displayCategory || null, // Store the appropriate category/division
        patientAge: record.patient?.age || null,
        patientGender: record.patient?.gender || null,
        patientGrade: record.patient?.grade || null,
        patientSection: record.patient?.section || null
      };

      return {
        ...record,
        patient_occupation: record.patient?.type || 'Unknown', // Use actual patient type
        medical_data
      };
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
        // Get the consultation record first to check if it exists and log details
        const consultationRecord = await prisma.consultation_records.findUnique({
          where: { consultation_id },
          include: {
            diagnosis: true,
            medAdministrations: true,
            prescriptions: true
          }
        });

        if (!consultationRecord) {
          throw new NotFoundException(`Consultation record with ID ${consultation_id} not found`);
        }

        // Log deletion attempt with more context, especially if doctor-reviewed
        console.log(`Attempting to delete consultation ${consultation_id}. Doctor reviewed: ${consultationRecord.doctor_reviewed}`);

        // First, delete associated diagnosis links
        await prisma.consultation_diagnosis.deleteMany({
          where: { consultation_id }
        });

        // Get all medicine administration records
        const medAdminRecords = await prisma.medAdministration.findMany({
          where: { consultation_id }
        });

        // Return quantities to inventory
        for (const record of medAdminRecords) {
          try {
            // Get the current medicine item (using medicine instead of inventory)
            const medicineItem = await prisma.medicine.findUnique({
              where: {
                medicine_id_medName: {
                  medicine_id: record.med_id,
                  medName: record.medName
                }
              }
            });

            if (!medicineItem) {
              console.log(`Medicine ${record.medName} (ID: ${record.med_id}) not found in inventory, skipping quantity return`);
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

            // Log the return to inventory - Using editsMedicine (lowercase e) instead of EditsInverntory
            await prisma.editsMedicine.create({
              data: {
                med_id: record.med_id,
                medName: record.medName,
                date: new Date(),
                cause: `Returned to inventory (Consultation #${consultation_id} deleted)`,
                addSubCount: record.count, // Positive for return
                runningTotal: newTotal, // Add the running total
                category_id: medicineItem.medCategory_id, // Use the correct category_id field from medicine
                nurse_id: 1 // Assuming system action - replace with actual nurse ID if available
              }
            });
          } catch (medicineError) {
            console.error(`Error processing medicine ${record.medName} (ID: ${record.med_id}):`, medicineError.message);
            // Continue with other medicines even if one fails
          }
        }

        // Delete all medicine administration records
        await prisma.medAdministration.deleteMany({
          where: { consultation_id }
        });

        // Delete any prescriptions if they exist
        try {
          await prisma.prescription.deleteMany({
            where: { consultation_id }
          });
        } catch (prescriptionError) {
          console.error("Error deleting prescriptions:", prescriptionError.message);
          // Continue deletion process even if prescription deletion fails
        }

        // Delete any chief complaints if they exist
        try {
          await prisma.chiefcomplaint.deleteMany({
            where: { consultation_id }
          });
        } catch (chiefComplaintError) {
          console.error("Error deleting chief complaints:", chiefComplaintError.message);
          // Continue deletion process
        }

        // Finally delete the consultation record
        return await prisma.consultation_records.delete({
          where: { consultation_id }
        });
      } catch (error) {
        console.error(`Error deleting consultation record ${consultation_id}:`, error);
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
          patient: {
            select: {
              type: true,
              division: true,
              category: true,
              age: true,
              gender: true,
              grade: true,
              section: true
            }
          },
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

      return consultations.map(record => {
        // Determine display category based on patient type
        const displayCategory = record.patient?.type?.toLowerCase() === 'student'
          ? record.patient.category // For students, show their category (Intern/Extern)
          : record.patient.division; // For faculty/staff, show their division

        return {
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
          patient_type: record.patient?.type || 'Unknown',
          category: displayCategory || '',
          diagnoses: record.diagnosis_text || 
                     record.diagnosis?.map(d => d.diagnosis?.name).filter(Boolean).join(', ') || 
                     record.complaint,
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
        };
      });
    } catch (error) {
      console.error('Error fetching patient consultations:', error);
      throw new Error('Failed to fetch consultation records');
    }
  }

  // Alias method for backward compatibility
  async getClientConsultations(clientId: number) {
    return this.getPatientConsultations(clientId);
  }

  /**
   * Updates medical data for a consultation record
   * @param consultation_id - ID of the consultation to update
   * @param medicalData - Medical data including measurements and doctor's notes
   * @returns Updated consultation record
   */
  async updateMedicalData(consultation_id: number, medicalData: any) {
    try {
      // Check if consultation exists
      const consultation = await this.prisma.consultation_records.findUnique({
        where: { consultation_id }
      });

      if (!consultation) {
        throw new NotFoundException(`Consultation with ID ${consultation_id} not found`);
      }

      // Extract specific fields for direct storage and also keep the complete data as JSON
      const { medical_data } = medicalData;
      
      // Parse the medical data if it's provided as a string
      let parsedMedicalData: Record<string, any> = {};
      if (medical_data) {
        parsedMedicalData = typeof medical_data === 'string' 
          ? JSON.parse(medical_data) 
          : medical_data;
      }      // Update the consultation record with both direct fields and medical_data JSON
      const updatedRecord = await this.prisma.consultation_records.update({
        where: { consultation_id },
        data: {
          // Store in dedicated fields (merged from HealthRecord)
          temperature: parsedMedicalData.temperature ? parseFloat(parsedMedicalData.temperature as string) : null,
          weight: parsedMedicalData.weight ? parseFloat(parsedMedicalData.weight as string) : null,
          height: parsedMedicalData.height ? parseFloat(parsedMedicalData.height as string) : null,
          blood_pressure: parsedMedicalData.blood_pressure as string || null,
          heart_rate: parsedMedicalData.heart_rate ? parseInt(parsedMedicalData.heart_rate as string, 10) : null,
          instructions: parsedMedicalData.treatment as string || null,
          doctor_prescription: parsedMedicalData.prescription as string || null,
          
          // Also store the complete data as JSON
          medical_data: {
            ...parsedMedicalData,
            updated_at: new Date().toISOString()
          },
          
          // Mark as reviewed by doctor
          doctor_reviewed: true,
          doctor_review_date: new Date()
        }
      });

      // Return the updated record
      return this.getConsultationRecord(consultation_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update medical data: ${error.message}`);
    }
  }

  /**
   * Creates a notification for the nurse about a medical record update
   * @param consultation_id - ID of the consultation that was updated
   * @param notificationData - Data for the notification
   * @returns Notification data
   */
  async notifyNurseAboutMedicalRecord(consultation_id: number, notificationData: any) {
    try {
      // Check if consultation exists
      const consultation = await this.prisma.consultation_records.findUnique({
        where: { consultation_id },
        include: {
          nurse: true,
          patient: true
        }
      });

      if (!consultation) {
        throw new NotFoundException(`Consultation with ID ${consultation_id} not found`);
      }

      // Update the consultation to mark it as shared with the nurse
      await this.prisma.consultation_records.update({
        where: { consultation_id },
        data: {
          nurse_notified: true,
          nurse_notification_date: new Date()
        }
      });

      // If the application has a notification system, create a notification
      // For this example, we'll just return a success message
      return {
        success: true,
        message: `Nurse ${consultation.nurse?.name || 'Unknown'} has been notified about the medical record update for patient ${consultation.patient_name}`,
        timestamp: new Date(),
        consultation_id
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to notify nurse: ${error.message}`);
    }
  }
}