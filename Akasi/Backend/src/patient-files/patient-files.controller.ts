import { Controller, Post, Get, UseGuards, UseInterceptors, UploadedFile, Body, Param, Query, Res, HttpStatus, HttpException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PatientFilesService } from './patient-files.service';
import { StorageService } from '../storage/storage.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('patient-files')
export class PatientFilesController {
  constructor(
    private readonly patientFilesService: PatientFilesService,
    private readonly storageService: StorageService
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('patient_id') patientId: string,
    @Body('type') type: string,
    @Body('grade') grade?: string,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      if (!patientId || !type) {
        throw new HttpException('Patient ID and file type are required', HttpStatus.BAD_REQUEST);
      }

      const patientIdNum = parseInt(patientId);
      const gradeNum = grade ? parseInt(grade) : null;

      // Use the standardized file storage service
      const fileInfo = await this.storageService.saveFileToStorage(
        {
          originalname: file.originalname,
          mimetype: file.mimetype,
          buffer: file.buffer,
          size: file.size
        },
        type,
        patientIdNum,
        gradeNum
      );

      // Create database record with file metadata
      const result = await this.patientFilesService.create(
        {
          grade: gradeNum,
          type,
          fileName: fileInfo.fileName,
          filePath: fileInfo.filePath,
          mimeType: fileInfo.mimeType,
          fileSize: fileInfo.fileSize
        },
        patientIdNum
      );

      return {
        success: true,
        id: result.id,
        message: 'File uploaded successfully',
        file: {
          name: fileInfo.fileName,
          type: type,
          size: fileInfo.fileSize,
          url: this.storageService.getFileUrl(fileInfo.filePath)
        }
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new HttpException(
        error.message || 'Failed to upload file',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('file/:type/:id')
  @UseGuards(JwtAuthGuard)
  async getFile(
    @Param('type') type: string,
    @Param('id') id: string,
    @Res() res: Response
  ) {
    try {
      const idNum = parseInt(id);
      const file = await this.patientFilesService.findById(idNum, type);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Get the absolute path to the file
      const absolutePath = this.storageService.getFilePath(file.filePath);

      // Check if the file exists on disk
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({
          message: 'File not found on disk',
          path: file.filePath
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);

      // Stream the file to the client
      return res.sendFile(absolutePath);
    } catch (error) {
      console.error('Error retrieving file:', error);
      return res.status(500).json({ message: 'Failed to retrieve file' });
    }
  }

  @Post('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('id') id: string,
    @Body('type') type: string
  ) {
    try {
      if (!id || !type) {
        throw new HttpException('File ID and type are required', HttpStatus.BAD_REQUEST);
      }

      const idNum = parseInt(id);
      return await this.patientFilesService.delete(idNum, type);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new HttpException(
        error.message || 'Failed to delete file',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status/:id')
  @UseGuards(JwtAuthGuard)
  async getFileStatus(
    @Param('id') id: string,
    @Query('type') type: string
  ) {
    try {
      if (!type) {
        throw new HttpException('File type is required', HttpStatus.BAD_REQUEST);
      }

      const idNum = parseInt(id);
      const status = await this.patientFilesService.getFileStatus(idNum, type);
      return { status: status.status, notes: status.notes || null };
    } catch (error) {
      console.error('Error getting file status:', error);
      throw new HttpException(
        error.message || 'Failed to get file status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Existing endpoints (fetch-file-statuses, pending, etc.) remain unchanged
}