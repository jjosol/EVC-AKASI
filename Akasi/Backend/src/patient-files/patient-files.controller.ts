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
    Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { PatientFilesService } from './patient-files.service';
import { diskStorage } from 'multer';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { FileStatusService } from '../file-status/file-status.service'
import { PatientStatusService } from '../patient-status/patient-status.service';
import { StorageService } from '../storage/storage.service';
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

@Controller('patient-files')
export class PatientFilesController {
    constructor(
        private readonly patientFilesService: PatientFilesService,
        private readonly prisma: PrismaService,
        private readonly fileStatusService: FileStatusService,
        private readonly patientStatusService: PatientStatusService,
        private readonly storageService: StorageService
    ) { }

    @Get()
    async getCertificates(@Query('grade', ParseIntPipe) grade: number) {
        try {
            const certificates = await this.patientFilesService.findAllByGrade(grade);
            return certificates;
        } catch (error) {
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch certificates',
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
                    // Create directory structure based on file type and date
                    const fileType = req.body.type || 'general';
                    const patientId = req.body.patient_id || 'unknown';
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    
                    // Create path like: uploads/dental/2023/05/patientId/
                    const uploadPath = path.resolve(__dirname, `../../uploads/${fileType}/${year}/${month}/${patientId}`);
                    fs.mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
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

                // File passes validation
                cb(null, true);
            },
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        }),
    )
    async uploadCertificate(
        @UploadedFile() file: Express.Multer.File,
        @Body('grade', ParseIntPipe) grade: number,
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
            console.log('Upload parameters:', { grade, type, patientId, fileName: file.originalname });

            // Use StorageService to handle file storage
            const fileInfo = await this.storageService.saveFileToStorage(file, type, patientId, grade);

            // Store in database with the provided patient ID
            const result = await this.patientFilesService.create({
                grade,
                type,
                fileName: fileInfo.fileName,
                filePath: fileInfo.filePath,
                mimeType: fileInfo.mimeType,
                fileSize: fileInfo.fileSize
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

    @Post('upload-prescription')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    console.log('[DEBUG prescription upload] req.body:', req.body);
                    const patientId = req.body.patient_id;
                    if (!patientId || isNaN(Number(patientId))) {
                        return cb(new Error('Missing or invalid patient_id'), null);
                    }
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const uploadPath = path.resolve(__dirname, `../../uploads/prescriptions/${year}/${month}/${patientId}`);
                    fs.mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
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

                // File passes validation
                cb(null, true);
            },
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        }),
    )
    async uploadPrescription(
        @UploadedFile() file: Express.Multer.File,
        @Body('consultation_id', ParseIntPipe) consultationId: number,
        @Body('patient_id', ParseIntPipe) patientId: number,
    ) {
        try {
            if (!file) {
                throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
            }

            // Log the received parameters for debugging
            console.log('Prescription upload parameters:', { consultationId, patientId, fileName: file.originalname });

            // Check if consultation exists
            const consultation = await this.prisma.consultation_records.findUnique({
                where: { consultation_id: consultationId },
            });

            if (!consultation) {
                throw new HttpException('Consultation not found', HttpStatus.NOT_FOUND);
            }

            // Create relative file path for storage in the database
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const relativePath = `prescriptions/${year}/${month}/${patientId}/${file.filename}`;

            // Save prescription record to database
            const prescription = await this.prisma.prescription.create({
                data: {
                    consultation_id: consultationId,
                    file_path: relativePath,
                    file_name: file.originalname,
                    mime_type: file.mimetype,
                    file_size: file.size,
                    date_uploaded: new Date()
                }
            });

            console.log('Prescription upload successful, returning:', prescription);

            return {
                message: 'Prescription uploaded successfully',
                id: prescription.prescription_id,
            };
        } catch (error) {
            // Clean up temp file if it exists
            if (file && file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            console.error('Prescription upload error:', error);

            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to upload prescription',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('download/:id')
    async downloadCertificate(
        @Param('id', ParseIntPipe) id: number,
        @Query('type') type: string,
        @Res() res: Response,
    ) {
        try {
            const document = await this.patientFilesService.findById(id, type);

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

            // Get URL for file access
            const fileUrl = this.storageService.getFileUrl(document.filePath);
            
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

    @Get('prescription/:id')
    async getPrescriptionFile(
        @Param('id', ParseIntPipe) prescriptionId: number,
        @Res() res: Response,
    ) {
        try {
            // Find prescription record
            const prescription = await this.prisma.prescription.findUnique({
                where: { prescription_id: prescriptionId }
            });

            if (!prescription) {
                throw new HttpException('Prescription not found', HttpStatus.NOT_FOUND);
            }

            // Check if file exists
            const filePath = path.resolve(__dirname, `../../uploads/${prescription.file_path}`);
            if (!fs.existsSync(filePath)) {
                throw new HttpException('Prescription file not found on disk', HttpStatus.NOT_FOUND);
            }

            // Set appropriate headers
            res.setHeader('Content-Type', prescription.mime_type);
            res.setHeader(
                'Content-Disposition',
                `inline; filename="${prescription.file_name}"`,
            );

            // Send the file
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to download prescription',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('prescription/by-consultation/:id')
    @UseGuards(JwtAuthGuard)
    async getPrescriptionByConsultation(
        @Param('id', ParseIntPipe) consultationId: number,
        @Res() res: Response,
    ) {
        try {
            // Find prescription record by consultation_id
            console.log(`Looking up prescription for consultation ID: ${consultationId}`);
            
            const prescription = await this.prisma.prescription.findFirst({
                where: { consultation_id: consultationId }
            });

            if (!prescription) {
                console.log(`No prescription found for consultation ID: ${consultationId}`);
                throw new HttpException('Prescription not found', HttpStatus.NOT_FOUND);
            }
            
            console.log(`Found prescription ID: ${prescription.prescription_id} for consultation ID: ${consultationId}`);
            
            // Return just the prescription data (not the file)
            return res.json({
                prescription_id: prescription.prescription_id,
                consultation_id: prescription.consultation_id,
                file_name: prescription.file_name,
                file_size: prescription.file_size,
                mime_type: prescription.mime_type,
                date_uploaded: prescription.date_uploaded
            });
        } catch (error) {
            console.error(`Error fetching prescription by consultation ${consultationId}:`, error);
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch prescription by consultation',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('view-prescription/:id')
    async viewPrescriptionWithToken(
        @Param('id', ParseIntPipe) prescriptionId: number,
        @Body('token') token: string,
        @Res() res: Response,
    ) {
        try {
            // Verify token validity (simplified version)
            if (!token) {
                return res.status(401).send('Unauthorized: No token provided');
            }

            // Find prescription record
            const prescription = await this.prisma.prescription.findUnique({
                where: { prescription_id: prescriptionId }
            });

            if (!prescription) {
                return res.status(404).send('Prescription not found');
            }

            // Check if file exists
            const filePath = path.resolve(__dirname, `../../uploads/${prescription.file_path}`);
            if (!fs.existsSync(filePath)) {
                return res.status(404).send('Prescription file not found on disk');
            }

            // Set appropriate content type based on mime type
            const contentType = prescription.mime_type || 'application/octet-stream';
            
            // Create an HTML page that will display the file with proper embedding
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Prescription File - ${prescription.file_name}</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                    .container { 
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                    }
                    .header {
                        background: #2f4a71;
                        color: white;
                        padding: 10px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .content {
                        flex-grow: 1;
                        height: calc(100vh - 60px);
                        width: 100%;
                        border: none;
                    }
                    .btn {
                        background: white;
                        color: #2f4a71;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .btn:hover {
                        background: #f0f0f0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Prescription: ${prescription.file_name}</h2>
                        <button class="btn" onclick="window.print()">Print</button>
                    </div>
                    ${contentType.startsWith('image/') 
                        ? `<img src="data:${contentType};base64,${fs.readFileSync(filePath).toString('base64')}" class="content" />`
                        : contentType === 'application/pdf'
                            ? `<iframe src="data:application/pdf;base64,${fs.readFileSync(filePath).toString('base64')}" class="content" type="application/pdf"></iframe>`
                            : `<div class="content">File format not supported for preview</div>`
                    }
                </div>
            </body>
            </html>
            `;

            // Send the HTML page
            res.setHeader('Content-Type', 'text/html');
            return res.send(htmlContent);
            
        } catch (error) {
            console.error('Error viewing prescription file:', error);
            return res.status(500).send('Error viewing prescription file: ' + error.message);
        }
    }

    @Post('delete/:id')
    async deleteCertificate(
        @Param('id', ParseIntPipe) id: number,
        @Body('type') type: string,
    ) {
        try {
            const result = await this.patientFilesService.delete(id, type);

            return {
                message: 'Document deleted successfully',
                id,
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to delete document',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Updated endpoint to update file status using the new FileStatusService
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

            // Update file status using the new service
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

            // Update file status using the new service
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
            const status = await this.patientFilesService.getFileStatus(id, type);
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

    // New endpoint to fetch all file statuses for a patient
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

    // New endpoint to get all patients with pending files
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