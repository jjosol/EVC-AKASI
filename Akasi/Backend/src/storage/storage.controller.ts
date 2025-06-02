import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, Param, Delete, Res, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('bulletin/:postId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBulletinFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('postId') postId: string,
  ) {
    return this.storageService.uploadFile(file, parseInt(postId));
  }

  @Post('prescription/:consultationId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPrescriptionFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('consultationId') consultationId: string,
  ) {
    return this.storageService.uploadPrescriptionFile(file, parseInt(consultationId));
  }

  @Post('patient-file/:patientId/:type')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPatientFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('patientId') patientId: string,
    @Param('type') type: string,
    @Body('grade') grade?: string,
    @Body('division') division?: string,
  ) {
    const gradeNum = grade ? parseInt(grade) : null;
    return this.storageService.uploadPatientFile(
      file, 
      parseInt(patientId), 
      type,
      gradeNum,
      division
    );
  }

  @Delete('file/:fileId')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('fileId') fileId: string) {
    return this.storageService.deleteFile(parseInt(fileId));
  }

  @Get('file/:path(*)')
  async serveFile(@Param('path') filePath: string, @Res() res: Response) {
    const fullPath = this.storageService.getFilePath(filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send({ message: 'File not found' });
    }
    
    return res.sendFile(fullPath);
  }

  // New endpoints for school year management

  @Get('school-years')
  @UseGuards(JwtAuthGuard)
  async listSchoolYears() {
    const schoolYears = await this.storageService.listSchoolYearFolders();
    const currentYear = this.storageService.getCurrentSchoolYear();
    
    return {
      schoolYears,
      currentYear
    };
  }

  @Get('current-school-year')
  async getCurrentSchoolYear() {
    return {
      currentYear: this.storageService.getCurrentSchoolYear()
    };
  }

  @Post('school-years/new')
  @UseGuards(JwtAuthGuard)
  async createNewSchoolYear() {
    const newYear = await this.storageService.createNewSchoolYearFolder();
    return {
      success: true,
      newSchoolYear: newYear
    };
  }

  @Post('school-years/set-active')
  @UseGuards(JwtAuthGuard)
  async setActiveSchoolYear(@Body('schoolYear') schoolYear: string) {
    if (!schoolYear) {
      return { success: false, message: 'School year is required' };
    }
    
    await this.storageService.setActiveSchoolYear(schoolYear);
    return {
      success: true,
      activeSchoolYear: schoolYear
    };
  }

  @Delete('school-years/clear/:schoolYear')
  @UseGuards(JwtAuthGuard)
  async clearSchoolYearFolder(@Param('schoolYear') schoolYear: string) {
    if (!schoolYear) {
      return { success: false, message: 'School year is required' };
    }
    
    await this.storageService.clearSchoolYearFolder(schoolYear);
    return {
      success: true,
      message: `Cleared contents of school year folder ${schoolYear}`
    };
  }
}
