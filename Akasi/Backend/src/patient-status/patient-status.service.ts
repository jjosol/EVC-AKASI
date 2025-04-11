// src/patient-status/patient-status.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PatientStatusService {
    constructor(private prisma: PrismaService) {}

    /**
     * Update a patient's status based on the status of their files
     * @param patientId The ID of the patient to update
     * @returns The updated patient status
     */
    async updatePatientStatus(patientId: number): Promise<string> {
        try {
            // Check if the patient exists
            const patient = await this.prisma.patient.findUnique({
                where: { patient_id: patientId },
            });

            if (!patient) {
                throw new HttpException(
                    `Patient with ID ${patientId} not found`,
                    HttpStatus.NOT_FOUND
                );
            }

            // Count files by status for all document types
            const [dental, medical, opthal, physical, dentalConsent, 
                   medicalConsent, dentalHistory, hhPds, laboratory] = await Promise.all([
                this.prisma.dental_certificates.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                }),
                this.prisma.medical_certificates.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                }),
                this.prisma.opthal_certificates.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                }),
                this.prisma.physical_exam.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                }),
                this.prisma.dental_consent.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                }),
                this.prisma.medical_consent.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                }),
                this.prisma.dental_history.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                }),
                this.prisma.hh_pds.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                }),
                this.prisma.laboratory.findMany({
                    where: { patient_id: patientId },
                    select: { status: true }
                })
            ]);

            // Combine all file statuses
            const allFiles = [
                ...dental, ...medical, ...opthal, ...physical, 
                ...dentalConsent, ...medicalConsent, ...dentalHistory, 
                ...hhPds, ...laboratory
            ];
            
            if (allFiles.length === 0) {
                // If no files, set status to pending
                await this.prisma.patient.update({
                    where: { patient_id: patientId },
                    data: { status: 'pending' }
                });
                return 'pending';
            }

            // Count by status
            const statusCounts = {
                pending: allFiles.filter(f => f.status === 'pending').length,
                rejected: allFiles.filter(f => f.status === 'rejected').length,
                complete: allFiles.filter(f => f.status === 'complete').length,
                total: allFiles.length
            };

            let newStatus = 'pending';

            // Determine status based on file statuses:
            // 1. If any files are rejected -> rejected
            // 2. If all files are complete -> complete
            // 3. If some files complete and some pending -> ongoing
            // 4. If all files pending -> pending
            if (statusCounts.pending === 0 && statusCounts.rejected === 0) {
                // All files are complete
                newStatus = 'complete';
            } else if (statusCounts.rejected > 0) {
                // At least one file is rejected
                newStatus = 'rejected';
            } else if (statusCounts.complete > 0) {
                // Some files complete, but others still pending
                newStatus = 'ongoing';
            }

            // Update patient status
            await this.prisma.patient.update({
                where: { patient_id: patientId },
                data: { status: newStatus }
            });

            return newStatus;
        } catch (error) {
            console.error('Error updating patient status:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Error updating patient status: ' + error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get all patients with pending or rejected files
     * @returns List of patients with pending status
     */
    async getPatientsWithPendingFiles() {
        try {
            // Method 1: Get patients with pending status directly
            const patients = await this.prisma.patient.findMany({
                where: {
                    OR: [
                        { status: 'pending' },
                        { status: 'ongoing' },
                        { status: 'rejected' }
                    ]
                },
                select: {
                    patient_id: true,
                    name: true,
                    grade: true,
                    section: true,
                    type: true,
                    status: true
                }
            });

            return patients;
        } catch (error) {
            console.error('Error getting patients with pending files:', error);
            throw new HttpException(
                'Error getting patients with pending files: ' + error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get a count of patients by status
     * @returns Object with counts for each status
     */
    async getPatientStatusCounts() {
        try {
            const patients = await this.prisma.patient.findMany({
                select: {
                    status: true
                }
            });

            const statusCounts = {
                total: patients.length,
                pending: 0,
                ongoing: 0,
                complete: 0,
                rejected: 0
            };

            // Count patients by status
            patients.forEach(patient => {
                statusCounts[patient.status]++;
            });

            return statusCounts;
        } catch (error) {
            console.error('Error getting patient status counts:', error);
            throw new HttpException(
                'Error getting patient status counts: ' + error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}