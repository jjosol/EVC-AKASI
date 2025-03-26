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
    Request
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ClientFilesService } from './client-files.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard'; // Make sure this path is correct

@Controller('client-files')
export class ClientFilesController {
    constructor(private readonly ClientFilesService: ClientFilesService) { }

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
    @UseGuards(JwtAuthGuard) // Add this line to protect the endpoint
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
        @Request() req // Add this to access the authenticated user
    ) {
        try {
            if (!file) {
                throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
            }

            // Get client ID from token as a fallback (more secure)
            const tokenClientId = req.user?.sub || req.user?.id;
            const finalClientId = clientId || tokenClientId;
            
            if (!finalClientId) {
                throw new HttpException('Client ID not provided', HttpStatus.BAD_REQUEST);
            }
            
            console.log('Using client ID:', finalClientId);

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
            }, finalClientId);

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
}
