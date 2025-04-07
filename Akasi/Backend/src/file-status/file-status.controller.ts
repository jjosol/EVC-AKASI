// src/controllers/file-status.controller.ts
import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import { FileStatusService } from './file-status.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface UpdateFileStatusDto {
    fileId: number;
    fileType: string;
    clientId: number;
    status: string;
    notes?: string | null;
}

@Controller()
export class FileStatusController {
    constructor(private fileStatusService: FileStatusService) { }

    /**
     * Updates the status of a specific file
     * @param fileData The file data including ID, type, status, and notes
     * @returns The updated file
     */
    @UseGuards(JwtAuthGuard)
    @Post('update-file-status')
    async updateFileStatus(@Body() fileData: UpdateFileStatusDto) {
        try {
            const updatedFile = await this.fileStatusService.updateFileStatus(fileData);
            return {
                success: true,
                data: updatedFile,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Retrieves all file statuses for a specific client
     * @param clientId The ID of the client
     * @returns An object containing file statuses
     */
    @UseGuards(JwtAuthGuard)
    @Get('fetch-file-statuses')
    async fetchFileStatuses(@Query('client_id') clientId: string) {
        try {
            const fileStatuses = await this.fileStatusService.fetchFileStatuses(Number(clientId));
            return {
                success: true,
                data: fileStatuses,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
}