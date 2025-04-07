import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ClientStatusService } from '../client-status/client-status.service';

interface CertificateUploadDto {
    type: string;
    fileName: string;
    fileData: Buffer;
    mimeType: string;
}

@Injectable()
export class ClientFilesStaffService {
    constructor(
        private prisma: PrismaService,
        private clientStatusService: ClientStatusService
    ) { }

    // Updated create method with removed grade parameter and validation
    async create(data: CertificateUploadDto, clientId: number) {
        const { type, fileData, mimeType, fileName } = data;

        try {
            // Verify the client exists
            const client = await this.prisma.client.findUnique({
                where: { client_id: clientId },
                select: { client_id: true },
            });

            if (!client) {
                throw new HttpException(
                    `Client with ID ${clientId} not found`,
                    HttpStatus.BAD_REQUEST
                );
            }

            const currentDate = new Date();
            let result: { id: number } = { id: 0 };

            // Create record based on certificate type with status directly in the table
            // Note: We still store the client's grade in the database for compatibility
            switch (type) {
                case 'dental':
                    const dental = await this.prisma.dental_certificates.create({
                        data: {
                            client_id: clientId,
                            grade: 0, // No longer setting grade
                            date: currentDate,
                            dental: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: dental.dental_id };
                    break;

                case 'medical':
                    const medical = await this.prisma.medical_certificates.create({
                        data: {
                            client_id: clientId,
                            grade: 0, // No longer setting grade
                            date: currentDate,
                            medical: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: medical.medical_id };
                    break;

                case 'opthal':
                    const opthal = await this.prisma.opthal_certificates.create({
                        data: {
                            client_id: clientId,
                            grade: 0, // No longer setting grade
                            date: currentDate,
                            opthal: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: opthal.opthal_id };
                    break;

                case 'physical':
                    const physical = await this.prisma.physical_exam.create({
                        data: {
                            client_id: clientId,
                            grade: 0, // No longer setting grade
                            date: currentDate,
                            physical: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: physical.physical_id };
                    break;

                default:
                    throw new HttpException(
                        'Invalid certificate type',
                        HttpStatus.BAD_REQUEST
                    );
            }

            // Update client status (will be set to pending because of the new pending file)
            await this.clientStatusService.updateClientStatus(clientId);

            console.log('Created certificate with ID:', result.id, 'with pending status');
            return result;
        } catch (error) {
            console.error('Error creating certificate:', error);
            throw error;
        }
    }

    // Method to get file status directly from the file tables
    async getFileStatus(fileId: number, fileType: string) {
        try {
            let status = null;

            switch (fileType) {
                case 'dental':
                    status = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: fileId },
                        select: { status: true, notes: true }
                    });
                    break;
                case 'medical':
                    status = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: fileId },
                        select: { status: true, notes: true }
                    });
                    break;
                case 'opthal':
                    status = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: fileId },
                        select: { status: true, notes: true }
                    });
                    break;
                case 'physical':
                    status = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: fileId },
                        select: { status: true, notes: true }
                    });
                    break;
            }

            return status || { status: 'pending', notes: null }; // Default to pending if not found
        } catch (error) {
            console.error('Error fetching file status:', error);
            throw error;
        }
    }

    // Modified to find all certificates regardless of grade
    async findAll() {
        try {
            // Get all certificate types without filtering by grade
            const [dental, medical, opthal, physical] = await Promise.all([
                this.prisma.dental_certificates.findMany({
                    select: {
                        dental_id: true,
                        date: true,
                        client_id: true,
                        status: true,
                        notes: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.medical_certificates.findMany({
                    select: {
                        medical_id: true,
                        date: true,
                        client_id: true,
                        status: true,
                        notes: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.opthal_certificates.findMany({
                    select: {
                        opthal_id: true,
                        date: true,
                        client_id: true,
                        status: true,
                        notes: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.physical_exam.findMany({
                    select: {
                        physical_id: true,
                        date: true,
                        client_id: true,
                        status: true,
                        notes: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
            ]);

            // Format and merge results
            const formatResults = (items, type, idField) => {
                return items.map((item) => {
                    return {
                        id: item[idField],
                        type,
                        name: `${type}_${item[idField]}.pdf`,
                        date: item.date,
                        studentName: item.client.name,
                        size: this.formatFileSize(Math.floor(Math.random() * 5 * 1024 * 1024)), // Simulated file size
                        status: item.status || 'pending',
                        notes: item.notes,
                        client_id: item.client_id
                    };
                });
            };

            return [
                ...formatResults(dental, 'dental', 'dental_id'),
                ...formatResults(medical, 'medical', 'medical_id'),
                ...formatResults(opthal, 'opthal', 'opthal_id'),
                ...formatResults(physical, 'physical', 'physical_id'),
            ];
        } catch (error) {
            console.error('Error finding certificates:', error);
            throw new Error(`Failed to fetch certificates: ${error.message}`);
        }
    }

    // Find certificates by client ID
    async findAllByClientId(clientId: number) {
        try {
            // Get all certificate types for the specified client
            const [dental, medical, opthal, physical] = await Promise.all([
                this.prisma.dental_certificates.findMany({
                    where: { client_id: clientId },
                    select: {
                        dental_id: true,
                        date: true,
                        client_id: true,
                        status: true,
                        notes: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.medical_certificates.findMany({
                    where: { client_id: clientId },
                    select: {
                        medical_id: true,
                        date: true,
                        client_id: true,
                        status: true,
                        notes: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.opthal_certificates.findMany({
                    where: { client_id: clientId },
                    select: {
                        opthal_id: true,
                        date: true,
                        client_id: true,
                        status: true,
                        notes: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.physical_exam.findMany({
                    where: { client_id: clientId },
                    select: {
                        physical_id: true,
                        date: true,
                        client_id: true,
                        status: true,
                        notes: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
            ]);

            // Format and merge results
            const formatResults = (items, type, idField) => {
                return items.map((item) => {
                    return {
                        id: item[idField],
                        type,
                        name: `${type}_${item[idField]}.pdf`,
                        date: item.date,
                        studentName: item.client.name,
                        size: this.formatFileSize(Math.floor(Math.random() * 5 * 1024 * 1024)), // Simulated file size
                        status: item.status || 'pending',
                        notes: item.notes,
                        client_id: item.client_id
                    };
                });
            };

            return [
                ...formatResults(dental, 'dental', 'dental_id'),
                ...formatResults(medical, 'medical', 'medical_id'),
                ...formatResults(opthal, 'opthal', 'opthal_id'),
                ...formatResults(physical, 'physical', 'physical_id'),
            ];
        } catch (error) {
            console.error('Error finding certificates by client ID:', error);
            throw new Error(`Failed to fetch certificates: ${error.message}`);
        }
    }

    // Modified findById to get status from each table
    async findById(id: number, type: string) {
        try {
            let result;
            let fileData;
            let clientId;
            let status;
            let notes;

            switch (type) {
                case 'dental':
                    result = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: id },
                        select: {
                            dental: true,
                            client_id: true,
                            status: true,
                            notes: true,
                            client: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    fileData = result.dental;
                    clientId = result.client_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'medical':
                    result = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: id },
                        select: {
                            medical: true,
                            client_id: true,
                            status: true,
                            notes: true,
                            client: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    fileData = result.medical;
                    clientId = result.client_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'opthal':
                    result = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: id },
                        select: {
                            opthal: true,
                            client_id: true,
                            status: true,
                            notes: true,
                            client: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    fileData = result.opthal;
                    clientId = result.client_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'physical':
                    result = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: id },
                        select: {
                            physical: true,
                            client_id: true,
                            status: true,
                            notes: true,
                            client: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    fileData = result.physical;
                    clientId = result.client_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                default:
                    throw new HttpException(
                        'Invalid certificate type',
                        HttpStatus.BAD_REQUEST,
                    );
            }

            return {
                fileName: `${type}_${id}.pdf`,
                fileData: fileData,
                mimeType: 'application/pdf',
                clientId: clientId,
                studentName: result.client.name,
                status: status || 'pending',
                notes: notes || null
            };
        } catch (error) {
            console.error('Error finding certificate by ID:', error);
            throw error;
        }
    }

    // Updated delete method to update client status after deletion
    async delete(id: number, type: string) {
        try {
            let clientId = 0;

            // First, get the client ID to update their status later
            switch (type) {
                case 'dental':
                    const dental = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: id },
                        select: { client_id: true }
                    });
                    clientId = dental ? dental.client_id : 0;
                    break;
                case 'medical':
                    const medical = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: id },
                        select: { client_id: true }
                    });
                    clientId = medical ? medical.client_id : 0;
                    break;
                case 'opthal':
                    const opthal = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: id },
                        select: { client_id: true }
                    });
                    clientId = opthal ? opthal.client_id : 0;
                    break;
                case 'physical':
                    const physical = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: id },
                        select: { client_id: true }
                    });
                    clientId = physical ? physical.client_id : 0;
                    break;
            }

            // Delete the file
            switch (type) {
                case 'dental':
                    await this.prisma.dental_certificates.delete({
                        where: { dental_id: id },
                    });
                    break;

                case 'medical':
                    await this.prisma.medical_certificates.delete({
                        where: { medical_id: id },
                    });
                    break;

                case 'opthal':
                    await this.prisma.opthal_certificates.delete({
                        where: { opthal_id: id },
                    });
                    break;

                case 'physical':
                    await this.prisma.physical_exam.delete({
                        where: { physical_id: id },
                    });
                    break;

                default:
                    throw new HttpException(
                        'Invalid certificate type',
                        HttpStatus.BAD_REQUEST,
                    );
            }

            // Update client status if we found a client ID
            if (clientId > 0) {
                await this.clientStatusService.updateClientStatus(clientId);
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting certificate:', error);
            throw error;
        }
    }

    // Helper method to format file size
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}