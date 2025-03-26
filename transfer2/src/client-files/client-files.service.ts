import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface CertificateUploadDto {
    grade: number;
    type: string;
    fileName: string;
    fileData: Buffer;
    mimeType: string;
}

@Injectable()
export class ClientFilesService {
    constructor(private prisma: PrismaService) { }

    async findAllByGrade(grade: number) {
        try {
            // Get all certificate types for the specified grade
            const [dental, medical, opthal, physical] = await Promise.all([
                this.prisma.dental_certificates.findMany({
                    where: { grade },
                    select: {
                        dental_id: true,
                        date: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.medical_certificates.findMany({
                    where: { grade },
                    select: {
                        medical_id: true,
                        date: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.opthal_certificates.findMany({
                    where: { grade },
                    select: {
                        opthal_id: true,
                        date: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.physical_exam.findMany({
                    where: { grade },
                    select: {
                        physical_id: true,
                        date: true,
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
                return items.map((item) => ({
                    id: item[idField],
                    type,
                    name: `${type}_${item[idField]}.pdf`,
                    date: item.date,
                    studentName: item.client.name,
                    size: this.formatFileSize(Math.floor(Math.random() * 5 * 1024 * 1024)), // Simulated file size
                }));
            };

            return [
                ...formatResults(dental, 'dental', 'dental_id'),
                ...formatResults(medical, 'medical', 'medical_id'),
                ...formatResults(opthal, 'opthal', 'opthal_id'),
                ...formatResults(physical, 'physical', 'physical_id'),
            ];
        } catch (error) {
            console.error('Error finding certificates by grade:', error);
            throw new Error(`Failed to fetch certificates: ${error.message}`);
        }
    }

    // Updated create method for ClientFilesService
    async create(data: CertificateUploadDto, clientId: number) {
        const { grade, type, fileData, mimeType, fileName } = data;

        try {
            // Verify the client exists and has the correct grade
            const client = await this.prisma.client.findUnique({
                where: { client_id: clientId },
                select: { client_id: true, grade: true },
            });

            if (!client) {
                throw new HttpException(
                    `Client with ID ${clientId} not found`,
                    HttpStatus.BAD_REQUEST
                );
            }

            // Optional: validate that the client's grade matches the uploaded grade
            if (client.grade !== grade) {
                throw new HttpException(
                    `Grade mismatch: Client grade (${client.grade}) doesn't match certificate grade (${grade})`,
                    HttpStatus.BAD_REQUEST
                );
            }

            const currentDate = new Date();
            let result: { id: number } = { id: 0 };

            // Create record based on certificate type
            switch (type) {
                case 'dental':
                    const dental = await this.prisma.dental_certificates.create({
                        data: {
                            client_id: clientId,
                            grade,
                            date: currentDate,
                            dental: fileData,
                        },
                    });
                    result = { id: dental.dental_id };
                    break;

                case 'medical':
                    const medical = await this.prisma.medical_certificates.create({
                        data: {
                            client_id: clientId,
                            grade,
                            date: currentDate,
                            medical: fileData,
                        },
                    });
                    result = { id: medical.medical_id };
                    break;

                case 'opthal':
                    const opthal = await this.prisma.opthal_certificates.create({
                        data: {
                            client_id: clientId,
                            grade,
                            date: currentDate,
                            opthal: fileData,
                        },
                    });
                    result = { id: opthal.opthal_id };
                    break;

                case 'physical':
                    const physical = await this.prisma.physical_exam.create({
                        data: {
                            client_id: clientId,
                            grade,
                            date: currentDate,
                            physical: fileData,
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

            console.log('Created certificate with ID:', result.id);
            return result;
        } catch (error) {
            console.error('Error creating certificate:', error);
            throw error;
        }
    }
    async findById(id: number, type: string) {
        try {
            let result;

            switch (type) {
                case 'dental':
                    result = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: id },
                        select: {
                            dental: true,
                            client: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;

                    return {
                        fileName: `dental_certificate_${id}.pdf`,
                        fileData: result.dental,
                        mimeType: 'application/pdf', // Assuming PDF storage
                    };

                case 'medical':
                    result = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: id },
                        select: {
                            medical: true,
                            client: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;

                    return {
                        fileName: `medical_certificate_${id}.pdf`,
                        fileData: result.medical,
                        mimeType: 'application/pdf',
                    };

                case 'opthal':
                    result = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: id },
                        select: {
                            opthal: true,
                            client: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;

                    return {
                        fileName: `opthal_certificate_${id}.pdf`,
                        fileData: result.opthal,
                        mimeType: 'application/pdf',
                    };

                case 'physical':
                    result = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: id },
                        select: {
                            physical: true,
                            client: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;

                    return {
                        fileName: `physical_exam_${id}.pdf`,
                        fileData: result.physical,
                        mimeType: 'application/pdf',
                    };

                default:
                    throw new HttpException(
                        'Invalid certificate type',
                        HttpStatus.BAD_REQUEST,
                    );
            }
        } catch (error) {
            console.error('Error finding certificate by ID:', error);
            throw error;
        }
    }

    async delete(id: number, type: string) {
        try {
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