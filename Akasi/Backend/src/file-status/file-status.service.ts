// src/file-status/file-status.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PatientStatusService } from '../patient-status/patient-status.service';

@Injectable()
export class FileStatusService {
    constructor(
        private prisma: PrismaService,
        private patientStatusService: PatientStatusService,
    ) { }

    /**
     * Updates the status of a specific file
     * @param fileData The file data including ID, type, status and notes
     * @returns The updated file
     */
    async updateFileStatus(fileData: {
        fileId: number;
        fileType: string;
        patientId: number;
        status: string;
        notes?: string | null;
    }) {
        try {
            let updatedFile = null;

            // Update the file based on file type
            switch (fileData.fileType) {
                case 'medical':
                    updatedFile = await this.prisma.medical_certificates.update({
                        where: { medical_id: fileData.fileId },
                        data: {
                            status: fileData.status,
                            notes: fileData.notes || null,
                        },
                    });
                    break;

                case 'dental':
                    updatedFile = await this.prisma.dental_certificates.update({
                        where: { dental_id: fileData.fileId },
                        data: {
                            status: fileData.status,
                            notes: fileData.notes || null,
                        },
                    });
                    break;

                case 'opthal':
                    updatedFile = await this.prisma.opthal_certificates.update({
                        where: { opthal_id: fileData.fileId },
                        data: {
                            status: fileData.status,
                            notes: fileData.notes || null,
                        },
                    });
                    break;

                case 'physical':
                    updatedFile = await this.prisma.physical_exam.update({
                        where: { physical_id: fileData.fileId },
                        data: {
                            status: fileData.status,
                            notes: fileData.notes || null,
                        },
                    });
                    break;

                // Add cases for other file types if needed
                default:
                    throw new Error(`Unsupported file type: ${fileData.fileType}`);
            }

            // After updating the file status, update the patient status
            await this.patientStatusService.updatePatientStatus(fileData.patientId);

            return updatedFile;
        } catch (error) {
            console.error(`Error updating file status: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves all file statuses for a specific patient
     * @param patient_id The ID of the patient
     * @returns An object containing file statuses
     */
    async fetchFileStatuses(patientId: number) {
        try {
            // Get all files from the various tables for this patient
            const [
                medicalCerts,
                dentalCerts,
                opthalCerts,
                physicalExams,
            ] = await Promise.all([
                this.prisma.medical_certificates.findMany({
                    where: { patient_id: patientId },
                    select: {
                        medical_id: true,
                        status: true,
                        notes: true,
                    },
                }),
                this.prisma.dental_certificates.findMany({
                    where: { patient_id: patientId },
                    select: {
                        dental_id: true,
                        status: true,
                        notes: true,
                    },
                }),
                this.prisma.opthal_certificates.findMany({
                    where: { patient_id: patientId },
                    select: {
                        opthal_id: true,
                        status: true,
                        notes: true,
                    },
                }),
                this.prisma.physical_exam.findMany({
                    where: { patient_id: patientId },
                    select: {
                        physical_id: true,
                        status: true,
                        notes: true,
                    },
                }),
            ]);

            // Format medical certificates
            const formattedMedicalCerts = medicalCerts.map(cert => ({
                file_id: cert.medical_id,
                file_type: 'medical',
                status: cert.status,
                notes: cert.notes,
            }));

            // Format dental certificates
            const formattedDentalCerts = dentalCerts.map(cert => ({
                file_id: cert.dental_id,
                file_type: 'dental',
                status: cert.status,
                notes: cert.notes,
            }));

            // Format ophthalmic certificates
            const formattedOpthalCerts = opthalCerts.map(cert => ({
                file_id: cert.opthal_id,
                file_type: 'opthal',
                status: cert.status,
                notes: cert.notes,
            }));

            // Format physical exams
            const formattedPhysicalExams = physicalExams.map(exam => ({
                file_id: exam.physical_id,
                file_type: 'physical',
                status: exam.status,
                notes: exam.notes,
            }));

            // Combine all file status data
            const allFileStatuses = [
                ...formattedMedicalCerts,
                ...formattedDentalCerts,
                ...formattedOpthalCerts,
                ...formattedPhysicalExams,
            ];

            return allFileStatuses;
        } catch (error) {
            console.error(`Error fetching file statuses: ${error.message}`);
            throw error;
        }
    }
}