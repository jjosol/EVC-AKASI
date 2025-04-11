import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FetchPatientFilesNurseService {
    constructor(private prisma: PrismaService) { }

    async getClientFilesByGrade(patientId: number, grade: number) {
        try {
            // First, verify the patient exists
            const patient = await this.prisma.patient.findUnique({
                where: { patient_id: patientId },
            });

            if (!patient) {
                throw new NotFoundException(`Patient with ID ${patientId} not found`);
            }

            // Fetch dental certificates
            const dentalCertificates = await this.prisma.dental_certificates.findMany({
                where: {
                    patient_id: patientId,
                    grade: grade,
                },
                select: {
                    dental_id: true,
                    date: true,
                    grade: true,
                    status: true,
                },
            });

            // Fetch medical certificates
            const medicalCertificates = await this.prisma.medical_certificates.findMany({
                where: {
                    patient_id: patientId,
                    grade: grade,
                },
                select: {
                    medical_id: true,
                    date: true,
                    grade: true,
                    status: true,
                },
            });

            // Fetch ophthalmological certificates
            const opthalCertificates = await this.prisma.opthal_certificates.findMany({
                where: {
                    patient_id: patientId,
                    grade: grade,
                },
                select: {
                    opthal_id: true,
                    date: true,
                    grade: true,
                    status: true,
                },
            });

            // Fetch physical exam records
            const physicalExams = await this.prisma.physical_exam.findMany({
                where: {
                    patient_id: patientId,
                    grade: grade,
                },
                select: {
                    physical_id: true,
                    date: true,
                    grade: true,
                    status: true,
                },
            });

            // Transform the results to a consistent format
            const transformedDental = dentalCertificates.map(cert => ({
                id: cert.dental_id,
                type: 'dental',
                typeLabel: 'Dental Certificate',
                date: cert.date,
                grade: cert.grade,
                status: cert.status,
            }));

            const transformedMedical = medicalCertificates.map(cert => ({
                id: cert.medical_id,
                type: 'medical',
                typeLabel: 'Medical Certificate',
                date: cert.date,
                grade: cert.grade,
                status: cert.status,
            }));

            const transformedOpthal = opthalCertificates.map(cert => ({
                id: cert.opthal_id,
                type: 'opthal',
                typeLabel: 'Ophthalmological Certificate',
                date: cert.date,
                grade: cert.grade,
                status: cert.status,
            }));

            const transformedPhysical = physicalExams.map(exam => ({
                id: exam.physical_id,
                type: 'physical',
                typeLabel: 'Physical Examination',
                date: exam.date,
                grade: exam.grade,
                status: exam.status,
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
            throw new Error(`Failed to fetch patient files: ${error.message}`);
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

            return {
                id,
                type,
                date: file.date,
                grade: file.grade,
                file_path: file.file_path,
                file_name: file.file_name,
                mime_type: file.mime_type,
                file_size: file.file_size,
                status: file.status,
                notes: file.notes,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Failed to fetch file: ${error.message}`);
        }
    }
}
