import { Controller, Post, Get, Delete, Param, Body, UseInterceptors, UploadedFile, Res, HttpStatus, HttpCode, BadRequestException, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create-all')
  async createBackupAll(@Body() options?: { 
    includeUploads?: boolean, 
    customDestination?: string 
  }) {
    return this.backupService.createBackupAll(options);
  }

  @Post('create-grade')
  async createGradeBackup(@Body() body: { gradeLevel: number }) {
    return this.backupService.createBackupAll({ gradeLevel: body.gradeLevel });
  }

  @Post('create-division')
  async createDivisionBackup(@Body() body: { division: string }) {
    return this.backupService.createBackupAll({ division: body.division });
  }

  @Post('create-schoolyear')
  async createSchoolYearBackup(@Body() body: { schoolYear: string, customDestination?: string }) {
    if (!body.schoolYear) throw new BadRequestException('schoolYear is required');
    return this.backupService.createSchoolYearBackup(body.schoolYear, { customDestination: body.customDestination });
  }

  @Get('auto-config')
  async getAutoBackupConfig() {
    return this.backupService.getAutoBackupConfig();
  }

  @Put('auto-config')
  async updateAutoBackupConfig(@Body() config: any) {
    return this.backupService.updateAutoBackupConfig(config);
  }

  @Post('run-now')
  async runBackupNow() {
    return this.backupService.runBackupNow();
  }

  @Post('create')
  async createBackup(@Body() body: { models: string[] }) {
    return this.backupService.createBackup(body.models);
  }

  @Get('list')
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Get('download/:filename')
  async downloadBackup(@Param('filename') filename: string, @Res() res: Response) {
    const backup = await this.backupService.getBackupFile(filename);
    
    // Send file to client
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/json');
    
    const fileStream = fs.createReadStream(backup.path);
    fileStream.pipe(res);
  }

  @Post('export-to-drive/:filename')
  @HttpCode(HttpStatus.OK)
  async exportToDrive(
    @Param('filename') filename: string,
    @Body() body: { driveFolder?: string }
  ) {
    return this.backupService.exportToDrive(filename, body.driveFolder);
  }

  @Delete('delete/:filename')
  async deleteBackup(@Param('filename') filename: string) {
    return this.backupService.deleteBackup(filename);
  }

  @Post('restore/server')
  async restoreFromServer(@Body() body: { filename: string }) {
    return this.backupService.restoreFromServer(body.filename);
  }

  @Post('restore/upload')
  @UseInterceptors(FileInterceptor('backupFile'))
  async restoreFromUpload(@UploadedFile() file: Express.Multer.File) {
    console.log('Received upload request with file:', file ? file.originalname : 'No file');
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    try {
      return await this.backupService.restoreFromUpload(file);
    } catch (error) {
      console.error('Error processing upload:', error);
      throw new BadRequestException(`Error processing upload: ${error.message}`);
    }
  }

  @Get('drive-folders')
  async listDriveFolders() {
    return this.backupService.listDriveFolders();
  }

  @Post('drive-folders')
  async createDriveFolder(@Body() body: { name: string }) {
    return this.backupService.createDriveFolder(body.name);
  }
}
