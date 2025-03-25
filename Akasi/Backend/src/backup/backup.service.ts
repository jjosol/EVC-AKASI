import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
// Updated import path to point to the correct location of PrismaService
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleDriveService } from './google-drive.service';

@Injectable()
export class BackupService {
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleDriveService: GoogleDriveService
  ) {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(models: string[]) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const backupPath = path.join(this.backupDir, filename);
    
    // Define data with a type that allows additional properties (including _metadata)
    const data: { [key: string]: any } = {};
    
    // Extract data for each selected model
    for (const modelName of models) {
      try {
        // Use Prisma client to fetch data from each model
        const modelData = await this.prisma[modelName].findMany();
        data[modelName] = modelData;
      } catch (error) {
        console.error(`Error backing up model ${modelName}:`, error);
        throw new Error(`Failed to backup model: ${modelName}`);
      }
    }
    
    // Add metadata to backup
    const metadata = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      models: models,
      recordCounts: {}
    };
    
    // Add record counts for each model
    for (const modelName of models) {
      metadata.recordCounts[modelName] = data[modelName]?.length || 0;
    }
    
    // Add metadata to backup file
    data._metadata = metadata;
    
    // Write data to file
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    
    return {
      success: true,
      filename,
      models,
      timestamp,
      metadata
    };
  }

  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      
      const backupsList = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async file => {
            const filePath = path.join(this.backupDir, file);
            const stats = fs.statSync(filePath);
            
            // Try to extract metadata from backup file
            let models = [];
            try {
              const fileContent = fs.readFileSync(filePath, 'utf8');
              const data = JSON.parse(fileContent);
              models = data._metadata?.models || Object.keys(data).filter(key => key !== '_metadata');
            } catch (error) {
              console.error(`Error parsing backup file ${file}:`, error);
            }
            
            return {
              filename: file,
              date: stats.mtime,
              size: stats.size,
              models
            };
          })
      );
      
      // Sort by date, newest first
      return backupsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async getBackupFile(filename: string) {
    const filePath = path.join(this.backupDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file ${filename} not found`);
    }
    
    return {
      filename,
      path: filePath,
    };
  }

  async deleteBackup(filename: string) {
    const filePath = path.join(this.backupDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file ${filename} not found`);
    }
    
    fs.unlinkSync(filePath);
    
    return {
      success: true,
      message: `Backup ${filename} deleted successfully`,
    };
  }

  async restoreFromServer(filename: string) {
    const filePath = path.join(this.backupDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file ${filename} not found`);
    }
    
    return this.restoreBackup(filePath);
  }

  async restoreFromUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    if (file.mimetype !== 'application/json' && !file.originalname.endsWith('.json')) {
      throw new BadRequestException('Invalid file format. Only JSON files are accepted.');
    }
    
    try {
      console.log('Processing uploaded file:', file.path);
      
      // With disk storage, file is already on disk at file.path
      // No need to write it again, just use the path directly
      const result = await this.restoreBackup(file.path);
      
      // Optionally clean up the uploaded file
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.warn('Failed to delete temp file:', error);
      }
      
      return result;
    } catch (error) {
      console.error('Error in restoreFromUpload:', error);
      // Clean up the file in case of error
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupError) {
        console.warn('Failed to delete temp file during error cleanup:', cleanupError);
      }
      throw error;
    }
  }

  private async restoreBackup(filePath: string) {
    let backupData;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      backupData = JSON.parse(fileContent);
    } catch (error) {
      throw new BadRequestException('Invalid backup file: ' + error.message);
    }
    
    if (!backupData || typeof backupData !== 'object') {
      throw new BadRequestException('Invalid backup data format');
    }
    
    // Extract metadata if available
    const metadata = backupData._metadata || {};
    
    // Get models to restore (excluding metadata)
    const models = Object.keys(backupData).filter(key => key !== '_metadata');
    
    if (models.length === 0) {
      throw new BadRequestException('No data models found in backup file');
    }
    
    // Start a transaction to ensure all-or-nothing restoration
    return await this.prisma.$transaction(async (prisma) => {
      const results = {
        success: true,
        restoredModels: [],
        recordCounts: {},
        errors: []
      };
      
      // Define the order of restoration based on dependencies
      const modelRestoreOrder = [
        'medicineCategory',
        'diagnosis_category',
        'admin',
        'client',
        'manager',
        'inventory',
        'equipment',
        'consultation_records',
        'diagnosis',
        'consultation_diagnosis',
        'EditsInverntory',
        'medAdministration',
        'dental_certificates',
        'medical_certificates',
        'opthal_certificates',
        'physical_exam',
        'appointment',
        'HSU_bulletin',
        'HSU_bulletin_files',
      ];
      
      // Sort models based on the defined order
      const sortedModels = [...models].sort((a, b) => {
        const indexA = modelRestoreOrder.indexOf(a);
        const indexB = modelRestoreOrder.indexOf(b);
        
        // If both models are in the order array, sort by their position
        if (indexA >= 0 && indexB >= 0) {
          return indexA - indexB;
        }
        
        // If only one model is in the array, prioritize it
        if (indexA >= 0) return -1;
        if (indexB >= 0) return 1;
        
        // If neither is in the array, maintain original order
        return 0;
      });
      
      // Process each model in sorted order
      for (const modelName of sortedModels) {
        try {
          if (!prisma[modelName]) {
            results.errors.push(`Model '${modelName}' not found in database schema`);
            continue;
          }
          
          const modelData = backupData[modelName];
          
          if (!Array.isArray(modelData)) {
            results.errors.push(`Invalid data format for model '${modelName}'`);
            continue;
          }
          
          // Skip empty models
          if (modelData.length === 0) {
            results.restoredModels.push(modelName);
            results.recordCounts[modelName] = 0;
            continue;
          }
          
          // Clear existing data first
          await this.clearModelData(prisma, modelName);
          
          // Insert new data
          if (modelData.length > 0) {
            // Handle composite primary keys and auto-increment fields
            await this.insertModelData(prisma, modelName, modelData);
          }
          
          results.restoredModels.push(modelName);
          results.recordCounts[modelName] = modelData.length;
        } catch (error) {
          console.error(`Error restoring model ${modelName}:`, error);
          results.errors.push(`Failed to restore model '${modelName}': ${error.message}`);
          
          // Continue with other models instead of failing the whole operation
          continue;
        }
      }
      
      // Mark as failed if any errors occurred
      if (results.errors.length > 0) {
        results.success = false;
      }
      
      await this.resetSequences(prisma, results.restoredModels);
      
      return results;
    }, {
      // Use longer timeout for large restores
      timeout: 60000
    });
  }

  private async clearModelData(prisma: any, modelName: string) {
    try {
      // Special handling for models with dependencies
      if (modelName === 'HSU_bulletin') {
        // First delete files since they reference posts
        await prisma.hSU_bulletin_files.deleteMany({});
      } else if (modelName === 'consultation_records') {
        // First delete related diagnoses
        await prisma.consultation_diagnosis.deleteMany({});
        // And med administration records
        await prisma.medAdministration.deleteMany({});
      } else if (modelName === 'inventory') {
        // First delete related edits and med administration
        await prisma.editsInverntory.deleteMany({});
        await prisma.medAdministration.deleteMany({});
      }
      
      // Delete all data from the model
      await prisma[modelName].deleteMany({});
    } catch (error) {
      throw new Error(`Failed to clear model ${modelName}: ${error.message}`);
    }
  }

  private async insertModelData(prisma: any, modelName: string, data: any[]) {
    // Create records in batches for better performance
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      // Create records one by one to handle unique constraints
      for (const record of batch) {
        try {
          await prisma[modelName].create({
            data: record,
          });
        } catch (error) {
          // If record already exists, attempt to update it
          if (error.code === 'P2002') {
            // Extract primary key fields based on model
            const primaryKey = this.getPrimaryKeyFields(modelName, record);
            
            if (Object.keys(primaryKey).length > 0) {
              await prisma[modelName].update({
                where: primaryKey,
                data: record,
              });
            } else {
              throw new Error(`Failed to determine primary key for model ${modelName}`);
            }
          } else {
            throw error;
          }
        }
      }
    }
  }

  private getPrimaryKeyFields(modelName: string, record: any) {
    // Define primary key fields for each model
    const primaryKeys = {
      manager: {
        manager_id: record.manager_id,
        username: record.username,
      },
      admin: {
        admin_id: record.admin_id,
        username: record.username,
      },
      client: {
        client_id: record.client_id,
        username: record.username,
      },
      inventory: {
        med_id_medName: {
          med_id: record.med_id,
          medName: record.medName,
        },
      },
      consultation_records: {
        consultation_id: record.consultation_id,
      },
      medAdministration: {
        consultation_id: record.consultation_id,
      },
      // Add more models as needed
    };
    
    // Default to ID-based primary key if not specifically defined
    if (!primaryKeys[modelName]) {
      if (record.id) return { id: record.id };
      if (record[`${modelName}_id`]) return { [`${modelName}_id`]: record[`${modelName}_id`] };
    }
    
    return primaryKeys[modelName] || {};
  }

  private async resetSequences(prisma: any, restoredModels: string[]) {
    // Only run this for MySQL
    if (process.env.DATABASE_URL?.includes('mysql')) {
      for (const modelName of restoredModels) {
        try {
          // Map Prisma model names to actual table names
          // This mapping should match your database schema
          const tableMapping: Record<string, string> = {
            'admin': 'Admin',
            'client': 'Client', 
            'manager': 'Manager',
            'inventory': 'Inventory',
            'medicineCategory': 'MedicineCategory',
            'consultation_records': 'Consultation_records',
            'diagnosis': 'Diagnosis',
            'consultation_diagnosis': 'Consultation_diagnosis',
            'medAdministration': 'MedAdministration',
            'HSU_bulletin': 'HSU_bulletin',
            'HSU_bulletin_files': 'HSU_bulletin_files',
            // Add other mappings as needed
          };

          const tableName = tableMapping[modelName] || modelName;
          
          // For each model, find the max ID and add 1 (or use 1 if table is empty)
          // This will be the new AUTO_INCREMENT value
          const idColumnName = `${modelName}_id`;
          
          // Find the maximum ID for this table
          const result = await prisma.$queryRaw`
            SELECT COALESCE(MAX(${prisma.$raw(idColumnName)}), 0) + 1 as max_id 
            FROM ${prisma.$raw(tableName)}
          `;
          
          const newAutoIncrement = result[0]?.max_id || 1;
          
          // Reset the AUTO_INCREMENT value
          await prisma.$executeRaw`
            ALTER TABLE ${prisma.$raw(tableName)} AUTO_INCREMENT = ${newAutoIncrement}
          `;
          
          console.log(`Reset AUTO_INCREMENT for ${tableName} to ${newAutoIncrement}`);
        } catch (error) {
          console.warn(`Could not reset AUTO_INCREMENT for ${modelName}:`, error);
          // Continue with other models instead of failing
        }
      }
    }
  }

  async exportToDrive(filename: string, folderId?: string) {
    const backup = await this.getBackupFile(filename);
    
    try {
      // Upload the file to Google Drive
      const result = await this.googleDriveService.uploadFile(
        backup.path,
        filename,
        folderId
      );
      
      return {
        success: true,
        filename,
        driveFileId: result.fileId,
        driveLink: result.webViewLink,
        message: 'Backup exported to Google Drive successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to export to Google Drive: ${error.message}`);
    }
  }

  async listDriveFolders() {
    return this.googleDriveService.listFolders();
  }

  async createDriveFolder(folderName: string) {
    return this.googleDriveService.createFolder(folderName);
  }
}
