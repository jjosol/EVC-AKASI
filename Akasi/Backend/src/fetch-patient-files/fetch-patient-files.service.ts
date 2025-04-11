// src/fetch-client-files/fetch-client-files.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FetchPatientFilesService {
    private readonly logger = new Logger(FetchPatientFilesService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Fetch ALL certificate files for the current user
     */
    async fetchAllClientFiles(currentUserId: number, userRole: string) {
        if (!currentUserId) {
            throw new NotFoundException('User ID is required');
        }

        try {
            // CRITICAL: For all queries, we ONLY select files where patient_id equals currentUserId
            // This ensures that only the current user's files are ever returned

            // Fetch dental certificates for current user ONLY (without grade filter)
            const dentalCertificates = await this.prisma.dental_certificates.findMany({
                where: {
                    patient_id: currentUserId, // ONLY current user's files
                },
                select: {
                    dental_id: true,
                    patient_id: true,
                    grade: true,
                    date: true,
                    status: true,
                },
            });

            // Fetch medical certificates for current user ONLY (without grade filter)
            const medicalCertificates = await this.prisma.medical_certificates.findMany({
                where: {
                    patient_id: currentUserId, // ONLY current user's files
                },
                select: {
                    medical_id: true,
                    patient_id: true,
                    grade: true,
                    date: true,
                    status: true,
                },
            });

            // Fetch ophthalmological certificates for current user ONLY (without grade filter)
            const opthalCertificates = await this.prisma.opthal_certificates.findMany({
                where: {
                    patient_id: currentUserId, // ONLY current user's files
                },
                select: {
                    opthal_id: true,
                    patient_id: true,
                    grade: true,
                    date: true,
                    status: true,
                },
            });

            // Fetch physical exam certificates for current user ONLY (without grade filter)
            const physicalExams = await this.prisma.physical_exam.findMany({
                where: {
                    patient_id: currentUserId, // ONLY current user's files
                },
                select: {
                    physical_id: true,
                    patient_id: true,
                    grade: true,
                    date: true,
                    status: true,
                },
            });

            // Transform data to a unified format
            const dentalFiles = dentalCertificates.map(cert => ({
                id: cert.dental_id,
                type: 'dental',
                typeLabel: 'Dental Certificate',
                patientId: cert.patient_id,
                grade: cert.grade,
                date: cert.date,
                status: cert.status,
            }));

            const medicalFiles = medicalCertificates.map(cert => ({
                id: cert.medical_id,
                type: 'medical',
                typeLabel: 'Medical Certificate',
                patientId: cert.patient_id,
                grade: cert.grade,
                date: cert.date,
                status: cert.status,
            }));

            const opthalFiles = opthalCertificates.map(cert => ({
                id: cert.opthal_id,
                type: 'opthal',
                typeLabel: 'Ophthalmological Certificate',
                patientId: cert.patient_id,
                grade: cert.grade,
                date: cert.date,
                status: cert.status,
            }));

            const physicalFiles = physicalExams.map(cert => ({
                id: cert.physical_id,
                type: 'physical',
                typeLabel: 'Physical Examination',
                patientId: cert.patient_id,
                grade: cert.grade,
                date: cert.date,
                status: cert.status,
            }));

            // Combine all files
            const allFiles = [...dentalFiles, ...medicalFiles, ...opthalFiles, ...physicalFiles];

            // Double-check that ALL files belong to current user before returning
            // This is a safety measure to ensure no other user's files ever get returned
            const verifiedOwnFiles = allFiles.filter(file => file.patientId === currentUserId);

            if (verifiedOwnFiles.length !== allFiles.length) {
                // This should never happen if the database queries are correctly filtering
                this.logger.error(`SECURITY ERROR: Found files not belonging to user ${currentUserId}`);
            }

            this.logger.log(`User ${currentUserId} retrieved ${verifiedOwnFiles.length} total files`);

            // Only return files that belong to the current user
            return verifiedOwnFiles;
        } catch (error) {
            this.logger.error('Error fetching patient files:', error);
            throw new NotFoundException('Error retrieving certificate files');
        }
    }

    /**
     * Filters client files by grade (to be used after fetchAllClientFiles)
     */
    filterFilesByGrade(files: any[], grade: number) {
        if (!grade) {
            return files; // If no grade specified, return all files
        }

        return files.filter(file => file.grade === grade);
    }

    /**
     * Backward compatibility method - now just gets all files and filters by grade
     */
    async fetchClientFiles(currentUserId: number, grade: number, userRole: string) {
        const allFiles = await this.fetchAllClientFiles(currentUserId, userRole);
        const filteredFiles = this.filterFilesByGrade(allFiles, grade);

        this.logger.log(`Filtered ${allFiles.length} files to ${filteredFiles.length} files for grade ${grade}`);

        return filteredFiles;
    }

    // Remaining methods (getFileInfo, getFileData) stay the same
    async getFileInfo(fileType: string, fileId: number, currentUserId: number, userRole: string) {
        // Implementation unchanged
        try {
            let patientId: number | null = null;
            let id: number | null = null;
            let filePath: string | null = null;
            let fileName: string | null = null;
            let mimeType: string | null = null;

            // First determine the file ownership
            switch (fileType) {
                case 'dental':
                    const dentalCert = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: fileId },
                        select: { 
                            patient_id: true,
                            dental_id: true,
                            file_path: true,
                            file_name: true,
                            mime_type: true
                        },
                    });
                    if (dentalCert) {
                        patientId = dentalCert.patient_id;
                        id = dentalCert.dental_id;
                        filePath = dentalCert.file_path;
                        fileName = dentalCert.file_name;
                        mimeType = dentalCert.mime_type;
                    }
                    break;

                case 'medical':
                    const medicalCert = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: fileId },
                        select: { 
                            patient_id: true,
                            medical_id: true,
                            file_path: true,
                            file_name: true,
                            mime_type: true
                        },
                    });
                    if (medicalCert) {
                        patientId = medicalCert.patient_id;
                        id = medicalCert.medical_id;
                        filePath = medicalCert.file_path;
                        fileName = medicalCert.file_name;
                        mimeType = medicalCert.mime_type;
                    }
                    break;

                case 'opthal':
                    const opthalCert = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: fileId },
                        select: { 
                            patient_id: true,
                            opthal_id: true,
                            file_path: true,
                            file_name: true,
                            mime_type: true
                        },
                    });
                    if (opthalCert) {
                        patientId = opthalCert.patient_id;
                        id = opthalCert.opthal_id;
                        filePath = opthalCert.file_path;
                        fileName = opthalCert.file_name;
                        mimeType = opthalCert.mime_type;
                    }
                    break;

                case 'physical':
                    const physicalExam = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: fileId },
                        select: { 
                            patient_id: true,
                            physical_id: true,
                            file_path: true,
                            file_name: true,
                            mime_type: true
                        },
                    });
                    if (physicalExam) {
                        patientId = physicalExam.patient_id;
                        id = physicalExam.physical_id;
                        filePath = physicalExam.file_path;
                        fileName = physicalExam.file_name;
                        mimeType = physicalExam.mime_type;
                    }
                    break;

                default:
                    this.logger.warn(`Invalid file type requested: ${fileType}`);
                    return null;
            }

            // If file doesn't exist or doesn't belong to current user, return null (not found)
            if (patientId === null || id === null || !filePath || patientId !== currentUserId) {
                this.logger.warn(`File not found or not authorized: ${fileType} ID ${fileId}`);
                return null;
            }

            this.logger.log(`User ${currentUserId} accessing file info: ID ${id}, type ${fileType}`);

            return {
                id,
                patientId,
                type: fileType,
                file_path: filePath,
                file_name: fileName,
                mime_type: mimeType
            };
        } catch (error) {
            this.logger.error('Error retrieving file info:', error);
            return null;
        }
    }

    async getFileData(fileType: string, fileId: number, currentUserId: number, userRole: string) {
        // Implementation unchanged
        try {
            // First check file info and ownership
            const fileInfo = await this.getFileInfo(fileType, fileId, currentUserId, userRole);

            if (!fileInfo) {
                throw new NotFoundException('File not found');
            }

            // If getFileInfo succeeds, ownership is already validated
            // Return the file path for the controller to stream
            return fileInfo.file_path;
        } catch (error) {
            this.logger.error('Error retrieving file data:', error);
            throw new NotFoundException('Error retrieving file data');
        }
    }
}