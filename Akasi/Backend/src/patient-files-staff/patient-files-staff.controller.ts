import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
    Res,
    HttpException,
    HttpStatus,
    UseGuards,
    Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { PatientFilesStaffService } from './patient-files-staff.service';
import { diskStorage } from 'multer';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { FileStatusService } from '../file-status/file-status.service';
import { PatientStatusService } from '../patient-status/patient-status.service';
import * as path from 'path';
import * as fs from 'fs';

// Add DTOs for file status updates
class UpdateFileStatusDto {
    fileId: number;
    fileType: string;
    patientId: number;
    status: 'pending' | 'complete' | 'rejected';
    notes?: string;
}

interface AuthenticatedUser {
    id?: number;
    admin_id?: number;
    nurse_id?: number;
    doctor_id?: number;
    patient_id?: number;
    role?: string;
}

@Controller('patient-files-staff')
export class PatientFilesStaffController {
    constructor(
        private readonly patientFilesStaffService: PatientFilesStaffService,
        private readonly prisma: PrismaService,
        private readonly fileStatusService: FileStatusService,
        private readonly patientStatusService: PatientStatusService
    ) { }

    // Updated to get all documents without grade parameter
    @Get()
    async getDocuments() {
        try {
            const documents = await this.patientFilesStaffService.findAll();
            return documents;
        } catch (error) {
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch documents',
                    message: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // New endpoint to get documents by patient ID
    @Get('by-patient/:patientId')
    async getDocumentsByPatientId(@Param('patientId', ParseIntPipe) patientId: number) {
        try {
            const documents = await this.patientFilesStaffService.findAllByPatientId(patientId);
            return documents;
        } catch (error) {
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch documents for patient',
                    message: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    // Create directory structure based on file type and patient ID
                    const fileType = req.body.type || 'general';
                    const patientId = req.body.patient_id || 'unknown';
                    const schoolYear = '2024-2025'; // Use the current school year
                    const today = new Date();
                    
                    // Map file type to the correct folder name
                    let folderName = 'general';
                    switch (fileType.toLowerCase()) {
                        case 'dental':
                            folderName = 'dental-certificates';
                            break;
                        case 'medical':
                            folderName = 'medical-certificates';
                            break;
                        case 'opthal':
                            folderName = 'opthal-certificates';
                            break;
                        case 'physical':
                            folderName = 'physical-exam';
                            break;
                        case 'laboratory':
                            folderName = 'laboratory';
                            break;
                        case 'dental_consent':
                            folderName = 'dental-consent';
                            break;
                        case 'medical_consent':
                            folderName = 'medical-consent';
                            break;
                        case 'dental_history':
                            folderName = 'dental-history';
                            break;
                        case 'hh_pds':
                            folderName = 'hh-pds';
                            break;
                        default:
                            folderName = 'general';
                    }

                    // Get patient grade information to create proper folder structure
                    const prismaService = new PrismaService();
                    prismaService.patient.findUnique({
                        where: { patient_id: parseInt(patientId) },
                        select: { grade: true }
                    }).then(patient => {
                        // Create complete upload path with school year, file type, and grade
                        let uploadPath;
                        if (patient && patient.grade) {
                            // For students, include grade level
                            const gradeFolderName = `g${patient.grade}`;
                            uploadPath = path.resolve(__dirname, `../../uploads/${schoolYear}/${folderName}/${gradeFolderName}`);
                        } else {
                            // For staff or if grade isn't available
                            uploadPath = path.resolve(__dirname, `../../uploads/${schoolYear}/${folderName}`);
                        }
                        
                        // Create directories if they don't exist
                        fs.mkdirSync(uploadPath, { recursive: true });
                        
                        // Log the destination path for debugging
                        console.log(`Saving file to: ${uploadPath}`);
                        
                        cb(null, uploadPath);
                    }).catch(error => {
                        console.error("Error getting patient grade:", error);
                        // Fallback path if we can't get patient info
                        const uploadPath = path.resolve(__dirname, `../../uploads/${schoolYear}/${folderName}`);
                        fs.mkdirSync(uploadPath, { recursive: true });
                        cb(null, uploadPath);
                    });
                },
                filename: (req, file, cb) => {
                    // Generate more descriptive filename
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = path.extname(file.originalname);
                    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
                    cb(null, `${sanitizedOriginalName}-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                // Check file type
                const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
                if (!allowedTypes.includes(file.mimetype)) {
                    return cb(
                        new HttpException(
                            'Only JPG, PNG, and PDF files are allowed',
                            HttpStatus.BAD_REQUEST,
                        ),
                        false,
                    );
                }

                // Check file size (10MB max) - multer handles this in limits
                cb(null, true);
            },
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        }),
    )
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Body('type') type: string,
        @Body('patient_id', ParseIntPipe) patientId: number,
    ) {
        try {
            if (!file) {
                throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
            }

            // Validate document type
            const validTypes = [
                'dental', 'medical', 'opthal', 'physical',
                'dental_consent', 'medical_consent', 'dental_history',
                'hh_pds', 'laboratory'
            ];
            
            if (!validTypes.includes(type)) {
                throw new HttpException(
                    `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
                    HttpStatus.BAD_REQUEST
                );
            }

            // Log the received parameters for debugging
            console.log('Upload parameters:', { type, patientId, fileName: file.originalname });

            // Store in database with the provided patient ID
            const result = await this.patientFilesStaffService.create({
                type,
                fileName: file.originalname,
                filePath: file.path,
                mimeType: file.mimetype,
                fileSize: file.size
            }, patientId);

            // Log the result for debugging
            console.log('Upload successful, returning:', result);

            return {
                message: 'Document uploaded successfully',
                id: result.id,
            };
        } catch (error) {
            // Clean up temp file if it exists
            if (file && file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            console.error('Upload error:', error);

            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to upload document',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('download/:id')
    async downloadDocument(
        @Param('id', ParseIntPipe) id: number,
        @Query('type') type: string,
        @Res() res: Response,
    ) {
        try {
            const document = await this.patientFilesStaffService.findById(id, type);

            if (!document) {
                throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
            }

            // Check if file exists on disk
            if (!document.fileData) {
                throw new HttpException(
                    'File not found on disk', 
                    HttpStatus.NOT_FOUND
                );
            }

            // Set appropriate headers
            res.setHeader('Content-Type', document.mimeType);
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${document.fileName}"`,
            );

            // Send the file data
            return res.send(document.fileData);
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to download document',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('delete/:id')
    async deleteDocument(
        @Param('id', ParseIntPipe) id: number,
        @Body('type') type: string,
    ) {
        try {
            const result = await this.patientFilesStaffService.delete(id, type);

            return {
                message: 'Document deleted successfully',
                id,
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to delete document',
                    message: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Updated endpoint to update file status
    @Post('update-file-status')
    @UseGuards(JwtAuthGuard)
    async updateFileStatus(@Body() fileData: UpdateFileStatusDto, @Req() request: Request) {
        try {
            // Extract nurse_id from the user object attached by JwtAuthGuard
            const nurseId = (request.user as AuthenticatedUser)?.nurse_id;

            // Validate nurse ID is available
            if (!nurseId) {
                throw new HttpException(
                    'Nurse ID not found. Make sure you are authenticated as a nurse.',
                    HttpStatus.UNAUTHORIZED
                );
            }

            // Update file status using the service
            const updatedFile = await this.fileStatusService.updateFileStatus({
                fileId: fileData.fileId,
                fileType: fileData.fileType,
                patientId: fileData.patientId,
                status: fileData.status,
                notes: fileData.notes || null
            });

            return {
                success: true,
                message: 'File status updated successfully',
                data: updatedFile
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to update file status',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Legacy endpoint for backwards compatibility
    @Post('status/:id')
    @UseGuards(JwtAuthGuard)
    async updateFileStatusLegacy(
        @Param('id', ParseIntPipe) id: number,
        @Body('type') type: string,
        @Body() updateStatusDto: UpdateFileStatusDto,
        @Req() request: Request
    ) {
        try {
            // Extract nurse_id from the user object attached by JwtAuthGuard
            const nurseId = (request.user as AuthenticatedUser)?.nurse_id;

            // Validate nurse ID is available
            if (!nurseId) {
                throw new HttpException(
                    'Nurse ID not found. Make sure you are authenticated as a nurse.',
                    HttpStatus.UNAUTHORIZED
                );
            }

            // Get patient ID from the request body
            const patientId = request.body.patient_id;

            if (!patientId) {
                throw new HttpException(
                    'Patient ID is required to update file status',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Update file status using the service
            await this.fileStatusService.updateFileStatus({
                fileId: id,
                fileType: type,
                patientId: patientId,
                status: updateStatusDto.status,
                notes: updateStatusDto.notes || null
            });

            return {
                success: true,
                message: 'File status updated successfully'
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to update file status',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Updated endpoint to get file status
    @Get('status/:id')
    async getFileStatus(
        @Param('id', ParseIntPipe) id: number,
        @Query('type') type: string
    ) {
        try {
            const status = await this.patientFilesStaffService.getFileStatus(id, type);
            return status;
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch file status',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Updated endpoint to get all files with pending status
    @Get('pending')
    @UseGuards(JwtAuthGuard)
    async getPendingFiles() {
        try {
            // Get all patients with pending status
            const pendingPatients = await this.patientStatusService.getPatientsWithPendingFiles();

            // Get all pending files for each patient
            const pendingFiles = [];

            for (const patient of pendingPatients) {
                // Get all file types for this patient with pending or rejected status
                const [dental, medical, opthal, physical, dentalConsent, medicalConsent, 
                      dentalHistory, hhPds, laboratory] = await Promise.all([
                    this.prisma.dental_certificates.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            dental_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    }),
                    this.prisma.medical_certificates.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            medical_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    }),
                    this.prisma.opthal_certificates.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            opthal_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    }),
                    this.prisma.physical_exam.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            physical_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    }),
                    this.prisma.dental_consent.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            dental_consent_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    }),
                    this.prisma.medical_consent.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            medical_consent_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    }),
                    this.prisma.dental_history.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            dental_history_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    }),
                    this.prisma.hh_pds.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            hh_pds_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    }),
                    this.prisma.laboratory.findMany({
                        where: {
                            patient_id: patient.patient_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            laboratory_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true,
                            type: true
                        }
                    })
                ]);

                // Format and add all file types to pendingFiles
                const addFormattedFiles = (files, type, idField) => {
                    files.forEach(file => {
                        pendingFiles.push({
                            id: file[idField],
                            type: type,
                            status: file.status,
                            notes: file.notes,
                            date: file.date,
                            patientName: patient.name,
                            patientId: patient.patient_id,
                            grade: file.grade || patient.grade,
                            section: patient.section,
                            category: patient.type,
                            ...(type === 'laboratory' && { labType: file.type })
                        });
                    });
                };

                addFormattedFiles(dental, 'dental', 'dental_id');
                addFormattedFiles(medical, 'medical', 'medical_id');
                addFormattedFiles(opthal, 'opthal', 'opthal_id');
                addFormattedFiles(physical, 'physical', 'physical_id');
                addFormattedFiles(dentalConsent, 'dental_consent', 'dental_consent_id');
                addFormattedFiles(medicalConsent, 'medical_consent', 'medical_consent_id');
                addFormattedFiles(dentalHistory, 'dental_history', 'dental_history_id');
                addFormattedFiles(hhPds, 'hh_pds', 'hh_pds_id');
                addFormattedFiles(laboratory, 'laboratory', 'laboratory_id');
            }

            return pendingFiles;
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch pending files',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Endpoint to fetch all file statuses for a patient
    @Get('fetch-file-statuses')
    @UseGuards(JwtAuthGuard)
    async fetchFileStatuses(@Query('patient_id') patientId: string) {
        try {
            const fileStatuses = await this.fileStatusService.fetchFileStatuses(Number(patientId));
            return {
                success: true,
                data: fileStatuses,
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch file statuses',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Endpoint to get all patients with pending files
    @Get('patients-with-pending-files')
    @UseGuards(JwtAuthGuard)
    async getPatientsWithPendingFiles() {
        try {
            const patients = await this.patientStatusService.getPatientsWithPendingFiles();
            return {
                success: true,
                data: patients,
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch patients with pending files',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}