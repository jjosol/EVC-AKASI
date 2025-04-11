// src/fetch-client-files/fetch-client-files.controller.ts
import { Controller, Get, Query, UseGuards, Param, Res, UnauthorizedException, Request, NotFoundException, Logger } from '@nestjs/common';
import { FetchPatientFilesService } from './fetch-patient-files.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('fetch-client-files')
export class FetchPatientFilesController {
    private readonly logger = new Logger(FetchPatientFilesController.name);

    constructor(private readonly fetchClientFilesService: FetchPatientFilesService) { }

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
        const currentUserId = req.user.patient_id || req.user.id;
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
        const currentUserId = req.user.patient_id || req.user.id;
        const userRole = req.user.role;

        if (!currentUserId) {
            throw new UnauthorizedException('User identification not found in token');
        }

        try {
            // First verify the file belongs to the current user
            const fileInfo = await this.fetchClientFilesService.getFileInfo(fileType, id, currentUserId, userRole);

            if (!fileInfo) {
                // If file doesn't exist or doesn't belong to current user, return 404
                throw new NotFoundException('File not found');
            }

            // Get the file path (ownership validation is already done in the service)
            const filePath = await this.fetchClientFilesService.getFileData(fileType, id, currentUserId, userRole);

            if (!filePath) {
                throw new NotFoundException('File content is empty');
            }

            // Check if file exists on disk
            if (!fs.existsSync(filePath)) {
                throw new NotFoundException('File not found on disk');
            }

            // Set appropriate headers
            res.setHeader('Content-Type', fileInfo.mime_type || 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename="${fileInfo.file_name}"`);
            res.setHeader('Cache-Control', 'private, max-age=3600'); // Private cache for better security

            // Include security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Content-Security-Policy', "default-src 'self'");

            // Stream the file instead of loading it all in memory
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
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
        const currentUserId = req.user.patient_id || req.user.id;
        const userRole = req.user.role;

        if (!currentUserId) {
            throw new UnauthorizedException('User identification not found in token');
        }

        this.logger.log(`User ${currentUserId} (${userRole}) requesting all files without filtering`);
        return this.fetchClientFilesService.fetchAllClientFiles(currentUserId, userRole);
    }
}