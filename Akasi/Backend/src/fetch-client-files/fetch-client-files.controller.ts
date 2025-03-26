// src/fetch-client-files/fetch-client-files.controller.ts
import { Controller, Get, Query, UseGuards, Param, Res, UnauthorizedException, Request, NotFoundException, Logger } from '@nestjs/common';
import { FetchClientFilesService } from './fetch-client-files.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('fetch-client-files')
export class FetchClientFilesController {
    private readonly logger = new Logger(FetchClientFilesController.name);

    constructor(private readonly fetchClientFilesService: FetchClientFilesService) { }

    /**
     * Get all client files with optional grade filtering
     */
    @UseGuards(JwtAuthGuard)
    @Get()
    async fetchClientFiles(
        @Query('grade') grade: string,
        @Request() req
    ) {
        // Extract the requesting user's ID and role from the JWT payload
        const currentUserId = req.user.client_id || req.user.id;
        const userRole = req.user.role;

        if (!currentUserId) {
            throw new UnauthorizedException('User identification not found in token');
        }

        // First, get all files for the user
        this.logger.log(`User ${currentUserId} (${userRole}) requesting all files`);
        const allFiles = await this.fetchClientFilesService.fetchAllClientFiles(currentUserId, userRole);

        // If grade is specified, filter the results
        if (grade) {
            const gradeNum = parseInt(grade, 10);
            if (!isNaN(gradeNum)) {
                this.logger.log(`Filtering files by grade ${gradeNum}`);
                return this.fetchClientFilesService.filterFilesByGrade(allFiles, gradeNum);
            }
        }

        // If no valid grade specified, return all files
        return allFiles;
    }

    /**
     * Get a specific file by type and ID
     */
    @UseGuards(JwtAuthGuard)
    @Get('file/:type/:id')
    async getFileData(
        @Param('type') fileType: string,
        @Param('id') fileId: string,
        @Request() req,
        @Res() res: Response,
    ) {
        const id = parseInt(fileId, 10);

        // Validate file type
        const validFileTypes = ['dental', 'medical', 'opthal', 'physical'];
        if (!validFileTypes.includes(fileType)) {
            throw new NotFoundException('Invalid file type');
        }

        // Extract the requesting user's ID and role from the JWT payload
        const currentUserId = req.user.client_id || req.user.id;
        const userRole = req.user.role;

        if (!currentUserId) {
            throw new UnauthorizedException('User identification not found in token');
        }

        try {
            // First verify the file belongs to the current user
            const fileInfo = await this.fetchClientFilesService.getFileInfo(fileType, id, currentUserId, userRole);

            if (!fileInfo) {
                // If file doesn't exist or doesn't belong to current user, return 404
                // This prevents information disclosure
                throw new NotFoundException('File not found');
            }

            // Get the file data (the service handles ownership validation)
            const fileData = await this.fetchClientFilesService.getFileData(fileType, id, currentUserId, userRole);

            if (!fileData || fileData.length === 0) {
                throw new NotFoundException('File content is empty');
            }

            // Try to detect file type from content
            let detectedType;
            try {
                // Use dynamic import for file-type (ESM module)
                const { fileTypeFromBuffer } = await import('file-type');
                detectedType = await fileTypeFromBuffer(fileData);

                // Log the detected type for debugging
                this.logger.log(`Detected file type: ${JSON.stringify(detectedType)}`);
            } catch (err) {
                this.logger.error('Error detecting file type:', err);
                detectedType = null;
            }

            // If file-type library couldn't detect the type, try manual detection
            if (!detectedType) {
                // Check for PDF signature (%PDF-)
                if (fileData.length >= 5 &&
                    fileData[0] === 0x25 && // %
                    fileData[1] === 0x50 && // P
                    fileData[2] === 0x44 && // D
                    fileData[3] === 0x46 && // F
                    fileData[4] === 0x2D) { // -
                    detectedType = { mime: 'application/pdf', ext: 'pdf' };
                }
                // Check for PNG signature
                else if (fileData.length >= 8 &&
                    fileData[0] === 0x89 &&
                    fileData[1] === 0x50 && // P
                    fileData[2] === 0x4E && // N
                    fileData[3] === 0x47 && // G
                    fileData[4] === 0x0D &&
                    fileData[5] === 0x0A &&
                    fileData[6] === 0x1A &&
                    fileData[7] === 0x0A) {
                    detectedType = { mime: 'image/png', ext: 'png' };
                }
                // Check for JPEG signature (FF D8)
                else if (fileData.length >= 2 &&
                    fileData[0] === 0xFF &&
                    fileData[1] === 0xD8) {
                    detectedType = { mime: 'image/jpeg', ext: 'jpg' };
                }
            }

            // Set appropriate content type based on detected file type or default to octet-stream
            let contentType = 'application/octet-stream'; // Safer default
            let disposition = 'inline';
            let fileExtension = 'bin';

            if (detectedType) {
                contentType = detectedType.mime;
                fileExtension = detectedType.ext;

                // For images, use inline disposition for viewing in browser
                if (contentType.startsWith('image/')) {
                    disposition = 'inline';
                }
            }

            // Log the content type being set
            this.logger.log(`Setting Content-Type: ${contentType} for file ${fileType}/${id}`);

            // Generate a filename for the download
            const filename = `${fileType}_${id}.${fileExtension}`;

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
            res.setHeader('Cache-Control', 'private, max-age=3600'); // Private cache for better security

            // Include security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Content-Security-Policy', "default-src 'self'");

            // Send the file data as response
            return res.send(fileData);
        } catch (error) {
            this.logger.error('Error serving file:', error);
            throw new NotFoundException('File not found');
        }
    }

    /**
     * Add a new endpoint to get all files without any filtering
     */
    @UseGuards(JwtAuthGuard)
    @Get('all')
    async getAllClientFiles(@Request() req) {
        const currentUserId = req.user.client_id || req.user.id;
        const userRole = req.user.role;

        if (!currentUserId) {
            throw new UnauthorizedException('User identification not found in token');
        }

        this.logger.log(`User ${currentUserId} (${userRole}) requesting all files without filtering`);
        return this.fetchClientFilesService.fetchAllClientFiles(currentUserId, userRole);
    }
}