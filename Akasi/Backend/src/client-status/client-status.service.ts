// src/client-status/client-status.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientStatusService {
    constructor(private prisma: PrismaService) { }

    /**
     * Updates a client's status based on their file statuses
     * @param clientId The ID of the client to update
     * @returns The updated client object
     */

    async updateClientStatus(clientId: number) {
        try {
            // First get the client to check their category and grade
            const client = await this.prisma.client.findUnique({
                where: { client_id: clientId },
                select: {
                    category: true,
                    grade: true,
                    status: true
                }
            });

            if (!client) {
                throw new Error(`Client with ID ${clientId} not found`);
            }

            // Get all files from the various certificate tables for this client
            const [
                medicalCerts,
                dentalCerts,
                opthalCerts,
                physicalExams,
            ] = await Promise.all([
                this.prisma.medical_certificates.findMany({
                    where: { client_id: clientId },
                    select: { status: true, grade: true },
                }),
                this.prisma.dental_certificates.findMany({
                    where: { client_id: clientId },
                    select: { status: true, grade: true },
                }),
                this.prisma.opthal_certificates.findMany({
                    where: { client_id: clientId },
                    select: { status: true, grade: true },
                }),
                this.prisma.physical_exam.findMany({
                    where: { client_id: clientId },
                    select: { status: true, grade: true },
                }),
            ]);

            // Combine all file statuses
            const allFileStatuses = [
                ...medicalCerts,
                ...dentalCerts,
                ...opthalCerts,
                ...physicalExams,
            ].map(file => file.status);

            // If no files are found, keep status as pending
            if (allFileStatuses.length === 0) {
                const updatedClient = await this.prisma.client.update({
                    where: { client_id: clientId },
                    data: { status: 'pending' },
                });
                return updatedClient;
            }

            let newStatus = 'pending';

            // Check if all existing files are complete
            const allFilesComplete = allFileStatuses.every(status => status === 'complete');

            // For students, we need additional checks for required files by grade level
            if (client.category === 'Student') {
                const currentGrade = client.grade;

                if (!currentGrade) {
                    // If grade is not set, can't be complete
                    newStatus = 'pending';
                } else {
                    // Check if all required file types exist for the current grade and are complete
                    const hasMedicalForGrade = medicalCerts.some(cert =>
                        cert.grade === currentGrade && cert.status === 'complete');
                    const hasDentalForGrade = dentalCerts.some(cert =>
                        cert.grade === currentGrade && cert.status === 'complete');
                    const hasOpthalForGrade = opthalCerts.some(cert =>
                        cert.grade === currentGrade && cert.status === 'complete');
                    const hasPhysicalForGrade = physicalExams.some(exam =>
                        exam.grade === currentGrade && exam.status === 'complete');

                    // Only mark as complete if student has all required file types for their grade AND all files are complete
                    if (hasMedicalForGrade && hasDentalForGrade && hasOpthalForGrade && hasPhysicalForGrade && allFilesComplete) {
                        newStatus = 'complete';
                    } else {
                        newStatus = 'pending';
                    }
                }
            } else {
                // For non-students, just check if all files are complete
                if (allFilesComplete) {
                    newStatus = 'complete';
                } else {
                    newStatus = 'pending';
                }
            }

            // Update the client status in the database
            const updatedClient = await this.prisma.client.update({
                where: { client_id: clientId },
                data: { status: newStatus },
            });

            return updatedClient;
        } catch (error) {
            console.error(`Error updating client status: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves all clients with pending files
     * @returns Array of clients with pending files
     */
    async getClientsWithPendingFiles() {
        try {
            const clientsWithPendingStatus = await this.prisma.client.findMany({
                where: { status: 'pending' },
                select: {
                    client_id: true,
                    name: true,
                    grade: true,
                    section: true,
                    status: true,
                },
            });

            return clientsWithPendingStatus;
        } catch (error) {
            console.error(`Error getting clients with pending files: ${error.message}`);
            throw error;
        }
    }
}