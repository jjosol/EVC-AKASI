import { Controller, Get, Param, Query, NotFoundException, UseGuards, Res } from '@nestjs/common';
import { FetchClientFilesAdminService } from './fetch-client-files-admin.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('fetch-client-files-admin')
export class FetchClientFilesAdminController {
    constructor(private readonly fetchClientFilesAdmin: FetchClientFilesAdminService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getClientFiles(
        @Query('client_id') clientId: string,
        @Query('grade') grade: string,
    ) {
        if (!clientId || !grade) {
            throw new NotFoundException('Client ID and grade are required');
        }

        const clientIdNum = parseInt(clientId, 10);
        const gradeNum = parseInt(grade, 10);

        if (isNaN(clientIdNum) || isNaN(gradeNum)) {
            throw new NotFoundException('Client ID and grade must be numbers');
        }

        const files = await this.fetchClientFilesAdmin.getClientFilesByGrade(clientIdNum, gradeNum);
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

        const file = await this.fetchClientFilesAdmin.getFile(type, idNum);

        if (!file) {
            throw new NotFoundException(`File not found: ${type}/${id}`);
        }

        // Determine content type based on file examination
        let contentType = 'application/pdf'; // Default to PDF

        // Check file signature to detect actual type
        if (file.data[0] === 0x89 && file.data[1] === 0x50 && file.data[2] === 0x4E && file.data[3] === 0x47) {
            contentType = 'image/png';
        } else if (file.data[0] === 0xFF && file.data[1] === 0xD8) {
            contentType = 'image/jpeg';
        } else if (file.data[0] === 0x25 && file.data[1] === 0x50 && file.data[2] === 0x44 && file.data[3] === 0x46) {
            contentType = 'application/pdf';
        }

        // Set appropriate headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${type}_${idNum}.${contentType.split('/')[1]}"`);

        // Send the file data as a buffer
        return res.send(Buffer.from(file.data));
    }
}
