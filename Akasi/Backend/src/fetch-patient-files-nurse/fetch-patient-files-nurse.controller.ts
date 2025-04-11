import { Controller, Get, Param, Query, NotFoundException, UseGuards, Res } from '@nestjs/common';
import { FetchPatientFilesNurseService } from './fetch-patient-files-nurse.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('fetch-client-files-patient')
export class FetchPatientFilesNurseController {
    constructor(private readonly fetchPatientFilesNurse: FetchPatientFilesNurseService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getClientFiles(
        @Query('patient_id') patientId: string,
        @Query('grade') grade: string,
    ) {
        if (!patientId || !grade) {
            throw new NotFoundException('Patient ID and grade are required');
        }

        const patientIdNum = parseInt(patientId, 10);
        const gradeNum = parseInt(grade, 10);

        if (isNaN(patientIdNum) || isNaN(gradeNum)) {
            throw new NotFoundException('Patient ID and grade must be numbers');
        }

        const files = await this.fetchPatientFilesNurse.getClientFilesByGrade(patientIdNum, gradeNum);
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

        const file = await this.fetchPatientFilesNurse.getFile(type, idNum);

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
