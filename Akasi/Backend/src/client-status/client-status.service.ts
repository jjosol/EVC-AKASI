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
            // Get all files from the various certificate tables for this client
            const [
                medicalCerts,
                dentalCerts,
                opthalCerts,
                physicalExams,
            ] = await Promise.all([
                this.prisma.medical_certificates.findMany({
                    where: { client_id: clientId },
                    select: { status: true },
                }),
                this.prisma.dental_certificates.findMany({
                    where: { client_id: clientId },
                    select: { status: true },
                }),
                this.prisma.opthal_certificates.findMany({
                    where: { client_id: clientId },
                    select: { status: true },
                }),
                this.prisma.physical_exam.findMany({
                    where: { client_id: clientId },
                    select: { status: true },
                }),
            ]);

            // Combine all file statuses
            const allFileStatuses = [
                ...medicalCerts,
                ...dentalCerts,
                ...opthalCerts,
                ...physicalExams,
            ].map(file => file.status);

            // If no files are found, keep status as is
            if (allFileStatuses.length === 0) {
                return null;
            }

            // Determine client status based on file statuses
            let newStatus = 'complete';

            // If any file is 'pending' or 'rejected', client status should be 'pending'
            if (allFileStatuses.some(status => status === 'pending' || status === 'rejected')) {
                newStatus = 'pending';
            }
            // If all files are 'complete', client status should be 'complete'
            else if (allFileStatuses.every(status => status === 'complete')) {
                newStatus = 'complete';
            }
            // If none of the above (e.g., some files are 'pending'), keep client as 'pending'
            else {
                newStatus = 'pending';
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