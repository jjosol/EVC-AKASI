// src/fetch-client-files/fetch-client-files.controller.ts
import { Controller, Get, Query, UseGuards, Param, Res, UnauthorizedException, Request, NotFoundException, Logger } from '@nestjs/common';
import { FetchClientFilesService } from './fetch-client-files.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Response } from 'express';
// Remove static import of file-type and use dynamic import instead

@Controller('client-files')
export class FetchClientFilesController {
    private readonly logger = new Logger(FetchClientFilesController.name);

    constructor(private readonly fetchClientFilesService: FetchClientFilesService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async fetchClientFiles(
        @Query('grade') grade: string,
        @Request() req
    ) {
        if (!grade) {
            throw new NotFoundException('Grade is required');
        }

        const gradeNum = parseInt(grade, 10);

        // Extract the requesting user's ID and role from the JWT payload
        const currentUserId = req.user.client_id || req.user.id;
        const userRole = req.user.role;

        if (!currentUserId) {
            throw new UnauthorizedException('User identification not found in token');
        }

        this.logger.log(`User ${currentUserId} (${userRole}) requesting files for grade ${gradeNum}`);

        // The service will fetch ONLY the current user's files, filtered by grade
        return this.fetchClientFilesService.fetchClientFiles(currentUserId, gradeNum, userRole);
    }

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
            } catch (err) {
                this.logger.error('Error detecting file type:', err);
                detectedType = null;
            }

            // Set appropriate content type based on detected file type or default to PDF
            let contentType = 'application/pdf'; // Default
            let disposition = 'inline';
            let fileExtension = 'pdf';

            if (detectedType) {
                contentType = detectedType.mime;
                fileExtension = detectedType.ext;

                // For images, use inline disposition for viewing in browser
                if (contentType.startsWith('image/')) {
                    disposition = 'inline';
                }
            }

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
}