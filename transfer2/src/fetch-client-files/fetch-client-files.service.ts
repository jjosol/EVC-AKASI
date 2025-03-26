// src/fetch-client-files/fetch-client-files.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// Import the fileTypeFromBuffer function from file-type using dynamic import
// We'll implement this in the method where it's used

@Injectable()
export class FetchClientFilesService {
    private readonly logger = new Logger(FetchClientFilesService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Fetch certificate files ONLY for the current user and specified grade
     */
    async fetchClientFiles(currentUserId: number, grade: number, userRole: string) {
        if (!currentUserId || !grade) {
            throw new NotFoundException('User ID and grade are required');
        }

        try {
            // CRITICAL: For all queries, we ONLY select files where client_id equals currentUserId
            // This ensures that only the current user's files are ever returned

            // Fetch dental certificates for current user ONLY
            const dentalCertificates = await this.prisma.dental_certificates.findMany({
                where: {
                    client_id: currentUserId, // ONLY current user's files
                    grade: grade,
                },
                select: {
                    dental_id: true,
                    client_id: true,
                    grade: true,
                    date: true,
                },
            });

            // Fetch medical certificates for current user ONLY
            const medicalCertificates = await this.prisma.medical_certificates.findMany({
                where: {
                    client_id: currentUserId, // ONLY current user's files
                    grade: grade,
                },
                select: {
                    medical_id: true,
                    client_id: true,
                    grade: true,
                    date: true,
                },
            });

            // Fetch ophthalmological certificates for current user ONLY
            const opthalCertificates = await this.prisma.opthal_certificates.findMany({
                where: {
                    client_id: currentUserId, // ONLY current user's files
                    grade: grade,
                },
                select: {
                    opthal_id: true,
                    client_id: true,
                    grade: true,
                    date: true,
                },
            });

            // Fetch physical exam certificates for current user ONLY
            const physicalExams = await this.prisma.physical_exam.findMany({
                where: {
                    client_id: currentUserId, // ONLY current user's files
                    grade: grade,
                },
                select: {
                    physical_id: true,
                    client_id: true,
                    grade: true,
                    date: true,
                },
            });

            // Transform data to a unified format
            const dentalFiles = dentalCertificates.map(cert => ({
                id: cert.dental_id,
                type: 'dental',
                typeLabel: 'Dental Certificate',
                clientId: cert.client_id,
                grade: cert.grade,
                date: cert.date,
            }));

            const medicalFiles = medicalCertificates.map(cert => ({
                id: cert.medical_id,
                type: 'medical',
                typeLabel: 'Medical Certificate',
                clientId: cert.client_id,
                grade: cert.grade,
                date: cert.date,
            }));

            const opthalFiles = opthalCertificates.map(cert => ({
                id: cert.opthal_id,
                type: 'opthal',
                typeLabel: 'Ophthalmological Certificate',
                clientId: cert.client_id,
                grade: cert.grade,
                date: cert.date,
            }));

            const physicalFiles = physicalExams.map(cert => ({
                id: cert.physical_id,
                type: 'physical',
                typeLabel: 'Physical Examination',
                clientId: cert.client_id,
                grade: cert.grade,
                date: cert.date,
            }));

            // Combine all files
            const allFiles = [...dentalFiles, ...medicalFiles, ...opthalFiles, ...physicalFiles];

            // Double-check that ALL files belong to current user before returning
            // This is a safety measure to ensure no other user's files ever get returned
            const verifiedOwnFiles = allFiles.filter(file => file.clientId === currentUserId);

            if (verifiedOwnFiles.length !== allFiles.length) {
                // This should never happen if the database queries are correctly filtering
                this.logger.error(`SECURITY ERROR: Found files not belonging to user ${currentUserId}`);
            }

            this.logger.log(`User ${currentUserId} retrieved ${verifiedOwnFiles.length} files for grade ${grade}`);

            // Only return files that belong to the current user
            return verifiedOwnFiles;
        } catch (error) {
            this.logger.error('Error fetching client files:', error);
            throw new NotFoundException('Error retrieving certificate files');
        }
    }

    /**
     * Get file info with strict ownership validation
     */
    async getFileInfo(fileType: string, fileId: number, currentUserId: number, userRole: string) {
        try {
            let clientId: number | null = null;
            let id: number | null = null;
            let fileData: Buffer | null = null;
            let mimeType = 'application/octet-stream'; // Default MIME type

            // First determine the file ownership
            switch (fileType) {
                case 'dental':
                    const dentalCert = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: fileId },
                        select: { client_id: true, dental_id: true, dental: true },
                    });
                    if (dentalCert) {
                        clientId = dentalCert.client_id;
                        id = dentalCert.dental_id;
                        fileData = dentalCert.dental as Buffer;
                    }
                    break;

                case 'medical':
                    const medicalCert = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: fileId },
                        select: { client_id: true, medical_id: true, medical: true },
                    });
                    if (medicalCert) {
                        clientId = medicalCert.client_id;
                        id = medicalCert.medical_id;
                        fileData = medicalCert.medical as Buffer;
                    }
                    break;

                case 'opthal':
                    const opthalCert = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: fileId },
                        select: { client_id: true, opthal_id: true, opthal: true },
                    });
                    if (opthalCert) {
                        clientId = opthalCert.client_id;
                        id = opthalCert.opthal_id;
                        fileData = opthalCert.opthal as Buffer;
                    }
                    break;

                case 'physical':
                    const physicalExam = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: fileId },
                        select: { client_id: true, physical_id: true, physical: true },
                    });
                    if (physicalExam) {
                        clientId = physicalExam.client_id;
                        id = physicalExam.physical_id;
                        fileData = physicalExam.physical as Buffer;
                    }
                    break;

                default:
                    this.logger.warn(`Invalid file type requested: ${fileType}`);
                    return null;
            }

            // If file doesn't exist or doesn't belong to current user, return null (not found)
            // This prevents information disclosure about the existence of other users' files
            if (clientId === null || id === null || !fileData || clientId !== currentUserId) {
                // Don't log sensitive details if not found - prevents information disclosure
                this.logger.warn(`File not found or not authorized: ${fileType} ID ${fileId}`);
                return null;
            }

            // Try to detect actual MIME type
            try {
                // Get a small sample from the beginning of the file (first 4100 bytes)
                const sampleBuffer = fileData.slice(0, Math.min(4100, fileData.length));

                // Use dynamic import for file-type (ESM module)
                const { fileTypeFromBuffer } = await import('file-type');
                const detectedType = await fileTypeFromBuffer(sampleBuffer);

                if (detectedType) {
                    mimeType = detectedType.mime;
                } else {
                    // If type detection fails, check for PDF signature (%PDF-)
                    if (sampleBuffer.length >= 5 &&
                        sampleBuffer[0] === 0x25 && // %
                        sampleBuffer[1] === 0x50 && // P
                        sampleBuffer[2] === 0x44 && // D
                        sampleBuffer[3] === 0x46 && // F
                        sampleBuffer[4] === 0x2D) { // -
                        mimeType = 'application/pdf';
                    }
                }
            } catch (err) {
                this.logger.warn('Error detecting file MIME type:', err);
                // Keep default MIME type
            }

            this.logger.log(`User ${currentUserId} accessing file info: ID ${id}, type ${fileType}`);

            return {
                id,
                clientId,
                type: fileType,
                mimeType,
            };
        } catch (error) {
            this.logger.error('Error retrieving file info:', error);
            return null;
        }
    }

    /**
     * Get file data with ownership validation
     */
    async getFileData(fileType: string, fileId: number, currentUserId: number, userRole: string) {
        try {
            // First check file info and ownership
            const fileInfo = await this.getFileInfo(fileType, fileId, currentUserId, userRole);

            if (!fileInfo) {
                throw new NotFoundException('File not found');
            }

            // If getFileInfo succeeds, ownership is already validated (it only returns files owned by current user)
            let fileData;

            switch (fileType) {
                case 'dental':
                    const dentalCert = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: fileId },
                        select: { dental: true, client_id: true },
                    });

                    // Only return data if file belongs to current user
                    if (!dentalCert || dentalCert.client_id !== currentUserId) {
                        throw new NotFoundException('File not found');
                    }

                    fileData = dentalCert?.dental;
                    break;

                case 'medical':
                    const medicalCert = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: fileId },
                        select: { medical: true, client_id: true },
                    });

                    // Only return data if file belongs to current user
                    if (!medicalCert || medicalCert.client_id !== currentUserId) {
                        throw new NotFoundException('File not found');
                    }

                    fileData = medicalCert?.medical;
                    break;

                case 'opthal':
                    const opthalCert = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: fileId },
                        select: { opthal: true, client_id: true },
                    });

                    // Only return data if file belongs to current user
                    if (!opthalCert || opthalCert.client_id !== currentUserId) {
                        throw new NotFoundException('File not found');
                    }

                    fileData = opthalCert?.opthal;
                    break;

                case 'physical':
                    const physicalExam = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: fileId },
                        select: { physical: true, client_id: true },
                    });

                    // Only return data if file belongs to current user
                    if (!physicalExam || physicalExam.client_id !== currentUserId) {
                        throw new NotFoundException('File not found');
                    }

                    fileData = physicalExam?.physical;
                    break;

                default:
                    throw new NotFoundException('Invalid file type');
            }

            if (!fileData) {
                throw new NotFoundException('File content not found');
            }

            this.logger.log(`Serving file ${fileId} (${fileType}) to user ${currentUserId}, size: ${fileData.length} bytes`);

            return fileData;
        } catch (error) {
            this.logger.error('Error retrieving file data:', error);
            throw new NotFoundException('Error retrieving file data');
        }
    }
}