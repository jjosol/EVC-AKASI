import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly currentSchoolYear = '2024-2025'; // Current school year as a constant
  private readonly bulletinDir = path.join(this.uploadDir, this.currentSchoolYear, 'bulletin');
  private readonly prescriptionDir = path.join(this.uploadDir, this.currentSchoolYear, 'prescriptions');
  private readonly medicalCertificatesDir = path.join(this.uploadDir, this.currentSchoolYear, 'medical-certificates');
  private readonly dentalCertificatesDir = path.join(this.uploadDir, this.currentSchoolYear, 'dental-certificates');
  private readonly opthalCertificatesDir = path.join(this.uploadDir, this.currentSchoolYear, 'opthal-certificates');
  private readonly physicalExamDir = path.join(this.uploadDir, this.currentSchoolYear, 'physical-exam');
  private readonly laboratoryDir = path.join(this.uploadDir, this.currentSchoolYear, 'laboratory');
  private readonly generalDir = path.join(this.uploadDir, this.currentSchoolYear, 'general');

  constructor(private prisma: PrismaService) { 
    // Ensure directories exist
    this.ensureDirectoriesExist();
  }

  private async ensureDirectoriesExist() {
    try {
      const directories = [
        this.uploadDir,
        path.join(this.uploadDir, this.currentSchoolYear),
        this.bulletinDir,
        this.prescriptionDir,
        this.medicalCertificatesDir,
        this.dentalCertificatesDir,
        this.opthalCertificatesDir,
        this.physicalExamDir,
        this.laboratoryDir,
        this.generalDir
      ];

      for (const dir of directories) {
        if (!fs.existsSync(dir)) {
          await mkdirAsync(dir, { recursive: true });
        }
      }
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async uploadFile(file: {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
  }, postId: number) {
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}_${postId}${fileExtension}`;
    
    // Get the current year for organizing files
    const today = new Date();
    const year = today.getFullYear().toString();
    
    // Create year directory
    const yearDir = path.join(this.bulletinDir, year);
    if (!fs.existsSync(yearDir)) {
      await mkdirAsync(yearDir, { recursive: true });
    }
    
    const filePath = path.join(yearDir, fileName);
    const relativePath = path.join('bulletin', year, fileName).replace(/\\/g, '/');

    try {
      // Ensure directory exists
      await this.ensureDirectoriesExist();
      
      // Write file to disk
      await writeFileAsync(filePath, file.buffer);
      
      // Get the file type based on MIME type
      const fileType = this.determineFileType(file.mimetype);
      
      // Create file record in database
      return await this.prisma.hsu_bulletin_files.create({
        data: {
          post_id: postId,
          file_name: file.originalname,
          file_path: relativePath,
          mime_type: file.mimetype,
          file_size: file.size
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async uploadPrescriptionFile(file: {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
  }, consultationId: number) {
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}_${consultationId}${fileExtension}`;
    
    // Get the current year for organizing files
    const today = new Date();
    const year = today.getFullYear().toString();
    
    // Create year directory
    const yearDir = path.join(this.prescriptionDir, year);
    if (!fs.existsSync(yearDir)) {
      await mkdirAsync(yearDir, { recursive: true });
    }
    
    const filePath = path.join(yearDir, fileName);
    const relativePath = path.join('prescriptions', year, fileName).replace(/\\/g, '/');

    try {
      await this.ensureDirectoriesExist();
      await writeFileAsync(filePath, file.buffer);
      
      return await this.prisma.prescription.create({
        data: {
          consultation_id: consultationId,
          file_name: file.originalname,
          file_path: relativePath,
          mime_type: file.mimetype,
          file_size: file.size
        }
      });
    } catch (error) {
      console.error('Error uploading prescription file:', error);
      throw error;
    }
  }

  async uploadPatientFile(file: {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
  }, patientId: number, type: string, grade: number = null, division: string = null) {
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}_${patientId}${fileExtension}`;
    let baseDirectory: string;
    let fileType = type; // Store original type for database entry
    
    // Determine the base directory based on file type
    switch (type.toLowerCase()) {
      case 'medical':
      case 'medical-certificate':
        baseDirectory = this.medicalCertificatesDir;
        fileType = 'medical-certificate';
        break;
      case 'dental':
      case 'dental-certificate':
        baseDirectory = this.dentalCertificatesDir;
        fileType = 'dental-certificate';
        break;
      case 'opthal':
      case 'opthal-certificate':
        baseDirectory = this.opthalCertificatesDir;
        fileType = 'opthal-certificate';
        break;
      case 'physical':
      case 'physical-exam':
        baseDirectory = this.physicalExamDir;
        fileType = 'physical-exam';
        break;
      case 'laboratory':
        baseDirectory = this.laboratoryDir;
        break;
      default:
        // Fallback to a general directory within uploads
        baseDirectory = this.generalDir;
        console.warn(`File type '${type}' not explicitly mapped to a directory, using general folder`);
        // Make sure general directory exists
        if (!fs.existsSync(baseDirectory)) {
          fs.mkdirSync(baseDirectory, { recursive: true });
        }
    }

    // Current year for this file path
    const today = new Date();
    
    // Create grade or division directory
    let categoryDir = baseDirectory;
    let relativeDirPath;
    
    // For students, use grade level; for staff, use division
    if (grade !== null) {
      // Student: use grade folder
      const gradeFolderName = `g${grade}`;
      categoryDir = path.join(baseDirectory, gradeFolderName);
      relativeDirPath = path.join(this.currentSchoolYear, fileType.toLowerCase(), gradeFolderName);
    } else if (division !== null) {
      // Staff: use division folder
      categoryDir = path.join(baseDirectory, division);
      relativeDirPath = path.join(this.currentSchoolYear, fileType.toLowerCase(), division);
    } else {
      // Default path without grade or division
      relativeDirPath = path.join(this.currentSchoolYear, fileType.toLowerCase());
    }
    
    // Ensure the category directory exists
    if (!fs.existsSync(categoryDir)) {
      await mkdirAsync(categoryDir, { recursive: true });
    }
    
    // Full path for the file
    const filePath = path.join(categoryDir, fileName);
    
    // Relative path for database storage (replacing backslashes with forward slashes)
    const relativePath = path.join(relativeDirPath, fileName).replace(/\\/g, '/');

    try {
      // Ensure base directories exist
      await this.ensureDirectoriesExist();
      
      // Write file to disk
      await writeFileAsync(filePath, file.buffer);
      
      console.log(`File saved to: ${filePath}`);
      console.log(`Relative path for DB: ${relativePath}`);
      console.log(`File type: ${fileType}`);
      
      // Create record in the appropriate table based on type
      const fileData = {
        patient_id: patientId,
        grade: grade,
        date: today,
        file_name: file.originalname,
        file_path: relativePath,
        mime_type: file.mimetype,
        file_size: file.size,
        status: 'pending',
        notes: null
      };

      switch (fileType.toLowerCase()) {
        case 'medical-certificate':
          return await this.prisma.medical_certificates.create({ data: fileData });
        case 'dental-certificate':
        case 'dental':
          return await this.prisma.dental_certificates.create({ data: fileData });
        case 'opthal-certificate':
        case 'opthal':
          return await this.prisma.opthal_certificates.create({ data: fileData });
        case 'physical-exam':
        case 'physical':
          return await this.prisma.physical_exam.create({ data: fileData });
        case 'laboratory':
          // For laboratory records, we need an additional 'type' field
          return await this.prisma.laboratory.create({
            data: {
              ...fileData,
              type: 'general' // Default type, can be overridden by parameters
            }
          });
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error(`Error uploading ${fileType} file:`, error);
      throw error;
    }
  }

  async deleteFile(fileId: number) {
    try {
      // Get file path from database
      const file = await this.prisma.hsu_bulletin_files.findUnique({
        where: { file_id: fileId }
      });

      if (file) {
        const filePath = path.join(this.uploadDir, file.file_path);
        
        // Delete file from disk if it exists
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Delete database record
        return await this.prisma.hsu_bulletin_files.delete({
          where: { file_id: fileId }
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Helper method to get file path for serving files
  getFilePath(relativePath: string): string {
    return path.join(this.uploadDir, relativePath);
  }

  // Helper method to determine file type based on MIME type
  private determineFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType === 'application/pdf') {
      return 'pdf';
    } else if (
      mimeType === 'application/vnd.ms-excel' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel.sheet.macroEnabled.12'
    ) {
      return 'excel';
    } else if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return 'word';
    } else {
      return 'document';
    }
  }
}