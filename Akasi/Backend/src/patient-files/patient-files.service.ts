import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PatientStatusService } from '../patient-status/patient-status.service';
import * as path from 'path';
import * as fs from 'fs';

interface CertificateUploadDto {
    grade: number;
    type: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
}

@Injectable()
export class PatientFilesService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads');

    constructor(
        private prisma: PrismaService,
        private patientStatusService: PatientStatusService
    ) { }

    // Helper to create file directory if it doesn't exist
    private ensureDirectoryExists(directoryPath: string): void {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
    }

    // Updated create method for file path storage
    async create(data: CertificateUploadDto, patientId: number) {
        const { grade, type, fileName, filePath, mimeType, fileSize } = data;

        try {
            // Verify the patient exists
            const patient = await this.prisma.patient.findUnique({
                where: { patient_id: patientId },
                select: { patient_id: true, grade: true, section: true },
            });

            if (!patient) {
                throw new HttpException(
                    `Patient with ID ${patientId} not found`,
                    HttpStatus.BAD_REQUEST
                );
            }

            // Use provided grade or fallback to patient's grade
            const documentGrade = grade !== undefined && grade !== null ? grade : patient.grade;

            const currentDate = new Date();
            let result: { id: number } = { id: 0 };

            // Common data for all document types
            const commonData = {
                patient_id: patientId,
                grade: documentGrade,
                date: currentDate,
                file_path: filePath,
                file_name: fileName,
                mime_type: mimeType,
                file_size: fileSize,
                status: 'pending',
                notes: null
            };

            // Create record based on certificate type
            switch (type) {
                case 'dental':
                    const dental = await this.prisma.dental_certificates.create({
                        data: commonData,
                    });
                    result = { id: dental.dental_id };
                    break;

                case 'medical':
                    const medical = await this.prisma.medical_certificates.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            file_path: filePath,
                            file_name: fileName,
                            mime_type: mimeType,
                            file_size: fileSize,
                            status: 'pending',
                            notes: null
                        },
                    });
                    result = { id: medical.medical_id };
                    break;

                case 'opthal':
                    const opthal = await this.prisma.opthal_certificates.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            file_path: filePath,
                            file_name: fileName,
                            mime_type: mimeType,
                            file_size: fileSize,
                            status: 'pending',
                            notes: null
                        },
                    });
                    result = { id: opthal.opthal_id };
                    break;

                case 'physical':
                    const physical = await this.prisma.physical_exam.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            file_path: filePath,
                            file_name: fileName,
                            mime_type: mimeType,
                            file_size: fileSize,
                            status: 'pending',
                            notes: null
                        },
                    });
                    result = { id: physical.physical_id };
                    break;

                case 'dental_consent':
                    const dentalConsent = await this.prisma.dental_consent.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            file_path: filePath,
                            file_name: fileName,
                            mime_type: mimeType,
                            file_size: fileSize,
                            status: 'pending',
                            notes: null
                        },
                    });
                    result = { id: dentalConsent.dental_consent_id };
                    break;

                case 'medical_consent':
                    const medicalConsent = await this.prisma.medical_consent.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            file_path: filePath,
                            file_name: fileName,
                            mime_type: mimeType,
                            file_size: fileSize,
                            status: 'pending',
                            notes: null
                        },
                    });
                    result = { id: medicalConsent.medical_consent_id };
                    break;

                case 'dental_history':
                    const dentalHistory = await this.prisma.dental_history.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            file_path: filePath,
                            file_name: fileName,
                            mime_type: mimeType,
                            file_size: fileSize,
                            status: 'pending',
                            notes: null
                        },
                    });
                    result = { id: dentalHistory.dental_history_id };
                    break;

                case 'hh_pds':
                    const hhPds = await this.prisma.hh_pds.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            file_path: filePath,
                            file_name: fileName,
                            mime_type: mimeType,
                            file_size: fileSize,
                            status: 'pending',
                            notes: null
                        },
                    });
                    result = { id: hhPds.hh_pds_id };
                    break;

                case 'laboratory':
                    const laboratory = await this.prisma.laboratory.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            file_path: filePath,
                            file_name: fileName,
                            mime_type: mimeType,
                            file_size: fileSize,
                            type: data.type || 'general', // Default type if not specified
                            status: 'pending',
                            notes: null
                        },
                    });
                    result = { id: laboratory.laboratory_id };
                    break;

                default:
                    throw new HttpException(
                        'Invalid document type',
                        HttpStatus.BAD_REQUEST
                    );
            }

            // Update patient status
            await this.patientStatusService.updatePatientStatus(patientId);

            console.log('Created document with ID:', result.id, 'with pending status');
            return result;
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    // Get file status from any file table
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
                case 'dental_consent':
                    status = await this.prisma.dental_consent.findUnique({
                        where: { dental_consent_id: fileId },
                        select: { status: true, notes: true }
                    });
                    break;
                case 'medical_consent':
                    status = await this.prisma.medical_consent.findUnique({
                        where: { medical_consent_id: fileId },
                        select: { status: true, notes: true }
                    });
                    break;
                case 'dental_history':
                    status = await this.prisma.dental_history.findUnique({
                        where: { dental_history_id: fileId },
                        select: { status: true, notes: true }
                    });
                    break;
                case 'hh_pds':
                    status = await this.prisma.hh_pds.findUnique({
                        where: { hh_pds_id: fileId },
                        select: { status: true, notes: true }
                    });
                    break;
                case 'laboratory':
                    status = await this.prisma.laboratory.findUnique({
                        where: { laboratory_id: fileId },
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

    // Modified findAllByGrade to include all document types
    async findAllByGrade(grade: number) {
        try {
            // Get all document types for the specified grade
            const [dental, medical, opthal, physical, 
                   dentalConsent, medicalConsent, dentalHistory,
                   hhPds, laboratory] = await Promise.all([
                this.prisma.dental_certificates.findMany({
                    where: { grade },
                    select: {
                        dental_id: true,
                        date: true,
                        patient_id: true,
                        status: true,
                        notes: true,
                        file_size: true,
                        patient: {
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
                        patient_id: true,
                        status: true,
                        notes: true,
                        file_size: true,
                        patient: {
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
                        patient_id: true,
                        status: true,
                        notes: true,
                        file_size: true,
                        patient: {
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
                        patient_id: true,
                        status: true,
                        notes: true,
                        file_size: true,
                        patient: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.dental_consent.findMany({
                    where: { grade },
                    select: {
                        dental_consent_id: true,
                        date: true,
                        patient_id: true,
                        status: true,
                        notes: true,
                        file_size: true,
                        patient: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.medical_consent.findMany({
                    where: { grade },
                    select: {
                        medical_consent_id: true,
                        date: true,
                        patient_id: true,
                        status: true,
                        notes: true,
                        file_size: true,
                        patient: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.dental_history.findMany({
                    where: { grade },
                    select: {
                        dental_history_id: true,
                        date: true,
                        patient_id: true,
                        status: true,
                        notes: true,
                        file_size: true,
                        patient: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.hh_pds.findMany({
                    where: { grade },
                    select: {
                        hh_pds_id: true,
                        date: true,
                        patient_id: true,
                        status: true,
                        notes: true,
                        file_size: true,
                        patient: {
                            select: {
                                name: true,
                            },
                        },
                    },
                }),
                this.prisma.laboratory.findMany({
                    where: { grade },
                    select: {
                        laboratory_id: true,
                        date: true,
                        patient_id: true,
                        status: true,
                        notes: true,
                        type: true,
                        file_size: true,
                        patient: {
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
                        name: item.file_name || `${type}_${item[idField]}.pdf`,
                        date: item.date,
                        studentName: item.patient.name,
                        size: item.file_size ? this.formatFileSize(item.file_size) : this.formatFileSize(Math.floor(Math.random() * 5 * 1024 * 1024)),
                        status: item.status || 'pending',
                        notes: item.notes,
                        patient_id: item.patient_id,
                        // For laboratory, include the specific lab type
                        ...(type === 'laboratory' && { labType: item.type })
                    };
                });
            };

            return [
                ...formatResults(dental, 'dental', 'dental_id'),
                ...formatResults(medical, 'medical', 'medical_id'),
                ...formatResults(opthal, 'opthal', 'opthal_id'),
                ...formatResults(physical, 'physical', 'physical_id'),
                ...formatResults(dentalConsent, 'dental_consent', 'dental_consent_id'),
                ...formatResults(medicalConsent, 'medical_consent', 'medical_consent_id'),
                ...formatResults(dentalHistory, 'dental_history', 'dental_history_id'),
                ...formatResults(hhPds, 'hh_pds', 'hh_pds_id'),
                ...formatResults(laboratory, 'laboratory', 'laboratory_id'),
            ];
        } catch (error) {
            console.error('Error finding documents by grade:', error);
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }
    }

    // Modified findById to handle file paths and all document types
    async findById(id: number, type: string) {
        try {
            let result;
            let filePath;
            let patientId;
            let status;
            let notes;
            let fileName;
            let mimeType;

            switch (type) {
                case 'dental':
                    result = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'medical':
                    result = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    // ... similar processing
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'opthal':
                    // ... similar structure
                    result = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'physical':
                    // ... similar structure
                    result = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'dental_consent':
                    result = await this.prisma.dental_consent.findUnique({
                        where: { dental_consent_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'medical_consent':
                    result = await this.prisma.medical_consent.findUnique({
                        where: { medical_consent_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'dental_history':
                    result = await this.prisma.dental_history.findUnique({
                        where: { dental_history_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'hh_pds':
                    result = await this.prisma.hh_pds.findUnique({
                        where: { hh_pds_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'laboratory':
                    result = await this.prisma.laboratory.findUnique({
                        where: { laboratory_id: id },
                        select: {
                            file_path: true,
                            file_name: true,
                            mime_type: true,
                            patient_id: true,
                            status: true,
                            notes: true,
                            type: true,
                            patient: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (!result) return null;
                    filePath = result.file_path;
                    fileName = result.file_name;
                    mimeType = result.mime_type;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                default:
                    throw new HttpException(
                        'Invalid document type',
                        HttpStatus.BAD_REQUEST,
                    );
            }

            // Read file from filesystem if it exists
            let fileData = null;
            if (filePath && fs.existsSync(filePath)) {
                fileData = fs.readFileSync(filePath);
            }

            return {
                fileName: fileName || `${type}_${id}.pdf`,
                filePath: filePath,
                fileData: fileData,
                mimeType: mimeType || 'application/pdf',
                patientId: patientId,
                studentName: result.patient.name,
                status: status || 'pending',
                notes: notes || null,
                // For laboratory, include the specific lab type
                ...(type === 'laboratory' && { labType: result.type })
            };
        } catch (error) {
            console.error('Error finding document by ID:', error);
            throw error;
        }
    }

    // Updated delete method to handle all document types
    async delete(id: number, type: string) {
        try {
            let patientId = 0;
            let filePath = null;

            // First, get the patient ID and file path to update their status later and delete file
            switch (type) {
                case 'dental':
                    const dental = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = dental ? dental.patient_id : 0;
                    filePath = dental ? dental.file_path : null;
                    break;
                case 'medical':
                    const medical = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = medical ? medical.patient_id : 0;
                    filePath = medical ? medical.file_path : null;
                    break;
                case 'opthal':
                    const opthal = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = opthal ? opthal.patient_id : 0;
                    filePath = opthal ? opthal.file_path : null;
                    break;
                case 'physical':
                    const physical = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = physical ? physical.patient_id : 0;
                    filePath = physical ? physical.file_path : null;
                    break;
                case 'dental_consent':
                    const dentalConsent = await this.prisma.dental_consent.findUnique({
                        where: { dental_consent_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = dentalConsent ? dentalConsent.patient_id : 0;
                    filePath = dentalConsent ? dentalConsent.file_path : null;
                    break;
                case 'medical_consent':
                    const medicalConsent = await this.prisma.medical_consent.findUnique({
                        where: { medical_consent_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = medicalConsent ? medicalConsent.patient_id : 0;
                    filePath = medicalConsent ? medicalConsent.file_path : null;
                    break;
                case 'dental_history':
                    const dentalHistory = await this.prisma.dental_history.findUnique({
                        where: { dental_history_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = dentalHistory ? dentalHistory.patient_id : 0;
                    filePath = dentalHistory ? dentalHistory.file_path : null;
                    break;
                case 'hh_pds':
                    const hhPds = await this.prisma.hh_pds.findUnique({
                        where: { hh_pds_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = hhPds ? hhPds.patient_id : 0;
                    filePath = hhPds ? hhPds.file_path : null;
                    break;
                case 'laboratory':
                    const laboratory = await this.prisma.laboratory.findUnique({
                        where: { laboratory_id: id },
                        select: { patient_id: true, file_path: true }
                    });
                    patientId = laboratory ? laboratory.patient_id : 0;
                    filePath = laboratory ? laboratory.file_path : null;
                    break;
            }

            console.log(`Attempting to delete file: ID=${id}, Type=${type}, File Path=${filePath}`);

            // Delete the physical file if it exists
            if (filePath) {
                // Always resolve relative to uploads directory
                const normalizedFilePath = filePath.replace(/^uploads[\\/]/, ''); // Remove leading uploads/ if present
                const absolutePath = path.join(this.uploadDir, normalizedFilePath);
                let fileDeleted = false;

                // Try both the absolute path and the raw filePath (in case it's already absolute)
                const possiblePaths = [
                    absolutePath,
                    filePath
                ];

                for (const possiblePath of possiblePaths) {
                    console.log(`Checking for file at: ${possiblePath}`);
                    try {
                        if (fs.existsSync(possiblePath)) {
                            fs.unlinkSync(possiblePath);
                            console.log(`Successfully deleted file: ${possiblePath}`);
                            fileDeleted = true;
                            break;
                        }
                    } catch (fileError) {
                        console.error(`Failed to delete file ${possiblePath}:`, fileError);
                    }
                }
                if (!fileDeleted) {
                    console.warn(`Could not find file to delete. Tried paths: ${possiblePaths.join(', ')}`);
                }
            }

            // Continue with database record deletion
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
                case 'dental_consent':
                    await this.prisma.dental_consent.delete({
                        where: { dental_consent_id: id },
                    });
                    break;
                case 'medical_consent':
                    await this.prisma.medical_consent.delete({
                        where: { medical_consent_id: id },
                    });
                    break;
                case 'dental_history':
                    await this.prisma.dental_history.delete({
                        where: { dental_history_id: id },
                    });
                    break;
                case 'hh_pds':
                    await this.prisma.hh_pds.delete({
                        where: { hh_pds_id: id },
                    });
                    break;
                case 'laboratory':
                    await this.prisma.laboratory.delete({
                        where: { laboratory_id: id },
                    });
                    break;
                default:
                    throw new HttpException(
                        'Invalid document type',
                        HttpStatus.BAD_REQUEST,
                    );
            }

            // Update patient status
            if (patientId > 0) {
                await this.patientStatusService.updatePatientStatus(patientId);
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    // Helper method to format file size
    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}