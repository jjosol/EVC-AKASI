import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PatientStatusService } from '../patient-status/patient-status.service';

interface CertificateUploadDto {
    grade: number;
    type: string;
    fileName: string;
    fileData: Buffer;
    mimeType: string;
    labType?: string; // Making this optional since it's only used for laboratory type
}

@Injectable()
export class PatientFilesService {
    constructor(
        private prisma: PrismaService,
        private patientStatusService: PatientStatusService
    ) { }

    // Updated create method with direct status handling in database tables
    async create(data: CertificateUploadDto, patientId: number) {
        const { grade, type, fileData, labType, mimeType, fileName } = data;

        try {
            // Verify the patient exists and has the correct grade
            const patient = await this.prisma.patient.findUnique({
                where: { patient_id: patientId },
                select: { patient_id: true, grade: true },
            });

            if (!patient) {
                throw new HttpException(
                    `Patient with ID ${patientId} not found`,
                    HttpStatus.BAD_REQUEST
                );
            }

            // Optional: validate that the patient's grade matches the uploaded grade
            if (patient.grade !== grade) {
                throw new HttpException(
                    `Grade mismatch: Patient grade (${patient.grade}) doesn't match certificate grade (${grade})`,
                    HttpStatus.BAD_REQUEST
                );
            }

            const currentDate = new Date();
            let result: { id: number } = { id: 0 };

            // Create record based on certificate type with status directly in the table
            switch (type) {
                case 'dental':
                    const dental = await this.prisma.dental_certificates.create({
                        data: {
                            patient_id: patientId,
                            grade,
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
                            patient_id: patientId,
                            grade,
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
                            patient_id: patientId,
                            grade,
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
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            physical: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: physical.physical_id };
                    break;
                
                case 'hh_pds':
                    const hh_pds = await this.prisma.hh_pds.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            hh_pds: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: hh_pds.hh_pds_id };
                    break;
                
                case 'medical_consent':
                    const medical_consent = await this.prisma.medical_consent.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            medical_consent: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: medical_consent.medical_consent_id };
                    break;
                
                case 'dental_consent':
                    const dental_consent = await this.prisma.dental_consent.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            dental_consent: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: dental_consent.dental_consent_id };
                    break;
                
                case 'dental_history':
                    const dental_history = await this.prisma.dental_history.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            dental_history: fileData,
                            status: 'pending', // Default status
                            notes: null
                        },
                    });
                    result = { id: dental_history.dental_history_id };
                    break;
                
                case 'laboratory':
                    const laboratory = await this.prisma.laboratory.create({
                        data: {
                            patient_id: patientId,
                            grade,
                            date: currentDate,
                            laboratory: fileData,
                            type:labType,
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

            // Update patient status (will be set to pending because of the new pending file)
            await this.patientStatusService.updatePatientStatus(patientId);

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
            let status: { status: string, notes: string | null } | null = null;

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

    // Modified findAllByGrade to get status directly from each table
    async findAllByGrade(grade: number) {
        try {
            // Get all certificate types for the specified grade
            const [dental, medical, opthal, physical] = await Promise.all([
                this.prisma.dental_certificates.findMany({
                    where: { grade },
                    select: {
                        dental_id: true,
                        date: true,
                        patient_id: true,
                        status: true,
                        notes: true,
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
                        name: `${type}_${item[idField]}.pdf`,
                        date: item.date,
                        studentName: item.patient.name,
                        size: this.formatFileSize(Math.floor(Math.random() * 5 * 1024 * 1024)), // Simulated file size
                        status: item.status || 'pending',
                        notes: item.notes,
                        patient_id: item.patient_id
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
            console.error('Error finding certificates by grade:', error);
            throw new Error(`Failed to fetch certificates: ${error.message}`);
        }
    }

    // Modified findById to get status from each table
    async findById(id: number, type: string) {
        try {
            let result;
            let fileData;
            let patientId;
            let status;
            let notes;

            switch (type) {
                case 'dental':
                    result = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: id },
                        select: {
                            dental: true,
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
                    fileData = result.dental;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'medical':
                    result = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: id },
                        select: {
                            medical: true,
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
                    fileData = result.medical;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'opthal':
                    result = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: id },
                        select: {
                            opthal: true,
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
                    fileData = result.opthal;
                    patientId = result.patient_id;
                    status = result.status;
                    notes = result.notes;
                    break;

                case 'physical':
                    result = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: id },
                        select: {
                            physical: true,
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
                    fileData = result.physical;
                    patientId = result.patient_id;
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
                patientId: patientId,
                studentName: result.patient.name,
                status: status || 'pending',
                notes: notes || null
            };
        } catch (error) {
            console.error('Error finding certificate by ID:', error);
            throw error;
        }
    }

    // Updated delete method to update patient status after deletion
    async delete(id: number, type: string) {
        try {
            let patientId = 0;

            // First, get the patient ID to update their status later
            switch (type) {
                case 'dental':
                    const dental = await this.prisma.dental_certificates.findUnique({
                        where: { dental_id: id },
                        select: { patient_id: true }
                    });
                    patientId = dental ? dental.patient_id : 0;
                    break;
                case 'medical':
                    const medical = await this.prisma.medical_certificates.findUnique({
                        where: { medical_id: id },
                        select: { patient_id: true }
                    });
                    patientId = medical ? medical.patient_id : 0;
                    break;
                case 'opthal':
                    const opthal = await this.prisma.opthal_certificates.findUnique({
                        where: { opthal_id: id },
                        select: { patient_id: true }
                    });
                    patientId = opthal ? opthal.patient_id : 0;
                    break;
                case 'physical':
                    const physical = await this.prisma.physical_exam.findUnique({
                        where: { physical_id: id },
                        select: { patient_id: true }
                    });
                    patientId = physical ? physical.patient_id : 0;
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

            // Update patient status if we found a patient ID
            if (patientId > 0) {
                await this.patientStatusService.updatePatientStatus(patientId);
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