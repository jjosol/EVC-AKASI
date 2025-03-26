import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FetchClientFilesAdminService {
    constructor(private prisma: PrismaService) { }

    async getClientFilesByGrade(clientId: number, grade: number) {
        try {
            // First, verify the client exists
            const client = await this.prisma.client.findUnique({
                where: { client_id: clientId },
            });

            if (!client) {
                throw new NotFoundException(`Client with ID ${clientId} not found`);
            }

            // Fetch dental certificates
            const dentalCertificates = await this.prisma.dental_certificates.findMany({
                where: {
                    client_id: clientId,
                    grade: grade,
                },
                select: {
                    dental_id: true,
                    date: true,
                    grade: true,
                },
            });

            // Fetch medical certificates
            const medicalCertificates = await this.prisma.medical_certificates.findMany({
                where: {
                    client_id: clientId,
                    grade: grade,
                },
                select: {
                    medical_id: true,
                    date: true,
                    grade: true,
                },
            });

            // Fetch ophthalmological certificates
            const opthalCertificates = await this.prisma.opthal_certificates.findMany({
                where: {
                    client_id: clientId,
                    grade: grade,
                },
                select: {
                    opthal_id: true,
                    date: true,
                    grade: true,
                },
            });

            // Fetch physical exam records
            const physicalExams = await this.prisma.physical_exam.findMany({
                where: {
                    client_id: clientId,
                    grade: grade,
                },
                select: {
                    physical_id: true,
                    date: true,
                    grade: true,
                },
            });

            // Transform the results to a consistent format
            const transformedDental = dentalCertificates.map(cert => ({
                id: cert.dental_id,
                type: 'dental',
                typeLabel: 'Dental Certificate',
                date: cert.date,
                grade: cert.grade,
            }));

            const transformedMedical = medicalCertificates.map(cert => ({
                id: cert.medical_id,
                type: 'medical',
                typeLabel: 'Medical Certificate',
                date: cert.date,
                grade: cert.grade,
            }));

            const transformedOpthal = opthalCertificates.map(cert => ({
                id: cert.opthal_id,
                type: 'opthal',
                typeLabel: 'Ophthalmological Certificate',
                date: cert.date,
                grade: cert.grade,
            }));

            const transformedPhysical = physicalExams.map(exam => ({
                id: exam.physical_id,
                type: 'physical',
                typeLabel: 'Physical Examination',
                date: exam.date,
                grade: exam.grade,
            }));

            // Combine all files
            return [
                ...transformedDental,
                ...transformedMedical,
                ...transformedOpthal,
                ...transformedPhysical,
            ];
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Failed to fetch client files: ${error.message}`);
        }
    }

    async getFile(type: string, id: number) {
        try {
            let file;

            switch (type) {
                case 'dental':
                    file = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: id },
                    });
                    break;
                case 'medical':
                    file = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: id },
                    });
                    break;
                case 'opthal':
                    file = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: id },
                    });
                    break;
                case 'physical':
                    file = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: id },
                    });
                    break;
                default:
                    throw new NotFoundException(`Invalid file type: ${type}`);
            }

            if (!file) {
                throw new NotFoundException(`File not found: ${type}/${id}`);
            }

            // Extract the binary data based on file type
            let data;
            switch (type) {
                case 'dental':
                    data = file.dental;
                    break;
                case 'medical':
                    data = file.medical;
                    break;
                case 'opthal':
                    data = file.opthal;
                    break;
                case 'physical':
                    data = file.physical;
                    break;
            }

            // Return the binary data and other file information
            return {
                id,
                type,
                date: file.date,
                grade: file.grade,
                data: data,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Failed to fetch file: ${error.message}`);
        }
    }
}
