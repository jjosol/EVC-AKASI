import { Controller, Get, Param, Query, NotFoundException, UseGuards, Res } from '@nestjs/common';
import { FetchStaffFilesNurseService } from './fetch-staff-files-nurse.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('fetch-staff-files-admin')
export class FetchStaffFilesNurseController {
    constructor(private readonly fetchStaffFilesAdmin: FetchStaffFilesNurseService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getStaffFiles(
        @Query('patient_id') patientId: string,
    ) {
        if (!patientId) {
            throw new NotFoundException('Patient ID is required');
        }

        const patientIdNum = parseInt(patientId, 10);

        if (isNaN(patientIdNum)) {
            throw new NotFoundException('Patient ID must be a number');
        }

        const files = await this.fetchStaffFilesAdmin.getStaffFiles(patientIdNum);
        return {
            success: true,
            data: files,
        };
    }

    @Get('file/:type/:id')
    @UseGuards(JwtAuthGuard)
    async getFile(
        @Param('type') type: string,
        @Param('id') id: string,
        @Res() res: Response
    ) {
        const idNum = parseInt(id, 10);

        if (isNaN(idNum)) {
            throw new NotFoundException('File ID must be a number');
        }

        if (!['dental', 'medical', 'opthal', 'physical'].includes(type)) {
            throw new NotFoundException('Invalid file type');
        }

        const file = await this.fetchStaffFilesAdmin.getFile(type, idNum);

        if (!file) {
            throw new NotFoundException(`File not found: ${type}/${id}`);
        }

        // Ensure file exists
        if (!fs.existsSync(file.file_path)) {
            throw new NotFoundException(`File not found on disk: ${file.file_path}`);
        }

        // Set appropriate headers
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);

        // Stream the file instead of loading it all at once
        const fileStream = fs.createReadStream(file.file_path);
        fileStream.pipe(res);
    }
}