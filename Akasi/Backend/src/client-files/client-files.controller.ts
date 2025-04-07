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
import { ClientFilesService } from './client-files.service';
import { diskStorage } from 'multer';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { FileStatusService } from '../file-status/file-status.service';
import { ClientStatusService } from '../client-status/client-status.service';
import * as path from 'path';
import * as fs from 'fs';

// Add DTOs for file status updates
class UpdateFileStatusDto {
    fileId: number;
    fileType: string;
    clientId: number;
    status: 'pending' | 'complete' | 'rejected';
    notes?: string;
}

interface AuthenticatedUser {
    id?: number;
    admin_id?: number;
    client_id?: number;
    role?: string;
}

@Controller('client-files')
export class ClientFilesController {
    constructor(
        private readonly ClientFilesService: ClientFilesService,
        private readonly prisma: PrismaService,
        private readonly fileStatusService: FileStatusService,
        private readonly clientStatusService: ClientStatusService
    ) { }

    @Get()
    async getCertificates(@Query('grade', ParseIntPipe) grade: number) {
        try {
            const certificates = await this.ClientFilesService.findAllByGrade(grade);
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
                    // Create temporary storage directory if it doesn't exist
                    const uploadPath = path.resolve(__dirname, '../../uploads/temp');
                    fs.mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = path.extname(file.originalname);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
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
    async uploadCertificate(
        @UploadedFile() file: Express.Multer.File,
        @Body('grade', ParseIntPipe) grade: number,
        @Body('type') type: string,
        @Body('client_id', ParseIntPipe) clientId: number,
    ) {
        try {
            if (!file) {
                throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
            }

            // Validate certificate type
            const validTypes = ['dental', 'medical', 'opthal', 'physical'];
            if (!validTypes.includes(type)) {
                throw new HttpException('Invalid certificate type', HttpStatus.BAD_REQUEST);
            }

            // Log the received parameters for debugging
            console.log('Upload parameters:', { grade, type, clientId, fileName: file.originalname });

            // Read file data
            const fileData = fs.readFileSync(file.path);

            // Store in database with the provided client ID
            const result = await this.ClientFilesService.create({
                grade,
                type,
                fileName: file.originalname,
                fileData,
                mimeType: file.mimetype,
            }, clientId);

            // Delete temp file after storing in DB
            fs.unlinkSync(file.path);

            // Log the result for debugging
            console.log('Upload successful, returning:', result);

            return {
                message: 'Certificate uploaded successfully',
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
                    error: 'Failed to upload certificate',
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
            const certificate = await this.ClientFilesService.findById(id, type);

            if (!certificate) {
                throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
            }

            // Set appropriate headers
            res.setHeader('Content-Type', certificate.mimeType);
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${certificate.fileName}"`,
            );

            // Send the file data
            return res.send(certificate.fileData);
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to download certificate',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('delete/:id')
    async deleteCertificate(
        @Param('id', ParseIntPipe) id: number,
        @Body('type') type: string,
    ) {
        try {
            const result = await this.ClientFilesService.delete(id, type);

            return {
                message: 'Certificate deleted successfully',
                id,
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to delete certificate',
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
            // Extract admin_id from the user object attached by JwtAuthGuard
            const adminId = (request.user as AuthenticatedUser)?.admin_id;

            // Validate admin ID is available
            if (!adminId) {
                throw new HttpException(
                    'Admin ID not found. Make sure you are authenticated as an admin.',
                    HttpStatus.UNAUTHORIZED
                );
            }

            // Update file status using the new service
            const updatedFile = await this.fileStatusService.updateFileStatus({
                fileId: fileData.fileId,
                fileType: fileData.fileType,
                clientId: fileData.clientId,
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
            // Extract admin_id from the user object attached by JwtAuthGuard
            const adminId = (request.user as AuthenticatedUser)?.admin_id;

            // Validate admin ID is available
            if (!adminId) {
                throw new HttpException(
                    'Admin ID not found. Make sure you are authenticated as an admin.',
                    HttpStatus.UNAUTHORIZED
                );
            }

            // Get client ID from the request body
            const clientId = request.body.client_id;

            if (!clientId) {
                throw new HttpException(
                    'Client ID is required to update file status',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Update file status using the new service
            await this.fileStatusService.updateFileStatus({
                fileId: id,
                fileType: type,
                clientId: clientId,
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
            const status = await this.ClientFilesService.getFileStatus(id, type);
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
            // Get all clients with pending status
            const pendingClients = await this.clientStatusService.getClientsWithPendingFiles();

            // Get all pending files for each client
            const pendingFiles = [];

            for (const client of pendingClients) {
                // Get all file types for this client
                const [dental, medical, opthal, physical] = await Promise.all([
                    this.prisma.dental_certificates.findMany({
                        where: {
                            client_id: client.client_id,
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
                            client_id: client.client_id,
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
                            client_id: client.client_id,
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
                            client_id: client.client_id,
                            status: { in: ['pending', 'rejected'] }
                        },
                        select: {
                            physical_id: true,
                            date: true,
                            status: true,
                            notes: true,
                            grade: true
                        }
                    })
                ]);

                // Format dental files
                dental.forEach(file => {
                    pendingFiles.push({
                        id: file.dental_id,
                        type: 'dental',
                        status: file.status,
                        notes: file.notes,
                        date: file.date,
                        clientName: client.name,
                        clientId: client.client_id,
                        grade: file.grade || client.grade,
                        section: client.section,
                        category: 'student'
                    });
                });

                // Format medical files
                medical.forEach(file => {
                    pendingFiles.push({
                        id: file.medical_id,
                        type: 'medical',
                        status: file.status,
                        notes: file.notes,
                        date: file.date,
                        clientName: client.name,
                        clientId: client.client_id,
                        grade: file.grade || client.grade,
                        section: client.section,
                        category: 'student'
                    });
                });

                // Format opthal files
                opthal.forEach(file => {
                    pendingFiles.push({
                        id: file.opthal_id,
                        type: 'opthal',
                        status: file.status,
                        notes: file.notes,
                        date: file.date,
                        clientName: client.name,
                        clientId: client.client_id,
                        grade: file.grade || client.grade,
                        section: client.section,
                        category: 'student'
                    });
                });

                // Format physical files
                physical.forEach(file => {
                    pendingFiles.push({
                        id: file.physical_id,
                        type: 'physical',
                        status: file.status,
                        notes: file.notes,
                        date: file.date,
                        clientName: client.name,
                        clientId: client.client_id,
                        grade: file.grade || client.grade,
                        section: client.section,
                        category: 'student'
                    });
                });
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

    // New endpoint to fetch all file statuses for a client
    @Get('fetch-file-statuses')
    @UseGuards(JwtAuthGuard)
    async fetchFileStatuses(@Query('client_id') clientId: string) {
        try {
            const fileStatuses = await this.fileStatusService.fetchFileStatuses(Number(clientId));
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

    // New endpoint to get all students with pending files
    @Get('students-with-pending-files')
    @UseGuards(JwtAuthGuard)
    async getStudentsWithPendingFiles() {
        try {
            const clients = await this.clientStatusService.getClientsWithPendingFiles();
            return {
                success: true,
                data: clients,
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Failed to fetch students with pending files',
                    message: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}