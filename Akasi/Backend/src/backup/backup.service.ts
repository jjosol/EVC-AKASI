import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleDriveService } from './google-drive.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class BackupService {
  private readonly backupDir = path.join(process.cwd(), 'backups');
  private readonly logger = new Logger(BackupService.name);
  private autoBackupConfig = {
    enabled: false,
    frequency: 'daily', // daily, weekly, monthly
    time: '00:00', // HH:MM format
    driveFolderId: '', // Google Drive folder ID
    retention: 7 // Number of backups to keep
  };
  private autoBackupConfigPath = path.join(process.cwd(), 'auto-backup-config.json');

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleDriveService: GoogleDriveService,
    private schedulerRegistry: SchedulerRegistry
  ) {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    // Load auto backup config if exists
    this.loadAutoBackupConfig();
    
    // Initialize auto backup job if enabled
    if (this.autoBackupConfig.enabled) {
      this.setupAutoBackupJob();
    }
  }

  // Load auto backup configuration from file
  private loadAutoBackupConfig() {
    try {
      if (fs.existsSync(this.autoBackupConfigPath)) {
        const configData = fs.readFileSync(this.autoBackupConfigPath, 'utf8');
        this.autoBackupConfig = JSON.parse(configData);
        this.logger.log('Auto backup configuration loaded');
      }
    } catch (error) {
      this.logger.error('Error loading auto backup config', error);
    }
  }

  // Save auto backup configuration to file
  private saveAutoBackupConfig() {
    try {
      fs.writeFileSync(
        this.autoBackupConfigPath, 
        JSON.stringify(this.autoBackupConfig, null, 2)
      );
    } catch (error) {
      this.logger.error('Error saving auto backup config', error);
    }
  }

  // Set up automatic backup job based on configuration
  private setupAutoBackupJob() {
    try {
      // Remove any existing job
      try {
        this.schedulerRegistry.deleteCronJob('autoBackup');
      } catch (error) {
        // Job doesn't exist yet, that's ok
      }

      // Parse time from HH:MM format
      const [hours, minutes] = this.autoBackupConfig.time.split(':').map(Number);
      
      // Create cron expression based on frequency
      let cronExpression = '';
      switch(this.autoBackupConfig.frequency) {
        case 'daily':
          cronExpression = `${minutes} ${hours} * * *`;
          break;
        case 'weekly':
          cronExpression = `${minutes} ${hours} * * 0`; // Sunday
          break;
        case 'monthly':
          cronExpression = `${minutes} ${hours} 1 * *`; // 1st of month
          break;
        default:
          cronExpression = `${minutes} ${hours} * * *`; // Default to daily
      }

      // Create and register the cron job
      const job = new CronJob(cronExpression, async () => {
        await this.runAutoBackup();
        // No return value to satisfy CronCommand type requirements
      });
      this.schedulerRegistry.addCronJob('autoBackup', job);
      job.start();
      
      this.logger.log(`Auto backup scheduled: ${this.autoBackupConfig.frequency} at ${this.autoBackupConfig.time}`);
    } catch (error) {
      this.logger.error('Error setting up auto backup job', error);
    }
  }

  // Execute the automatic backup process
  private async runAutoBackup() {
    this.logger.log('Starting automatic backup...');
    try {
      // Create backup of all models
      const result = await this.createBackupAll();
      
      // Upload to Google Drive if folder ID is set
      if (this.autoBackupConfig.driveFolderId) {
        try {
          const driveResult = await this.exportToDrive(
            result.filename,
            this.autoBackupConfig.driveFolderId
          );
          this.logger.log(`Auto backup uploaded to Google Drive: ${driveResult.driveLink}`);
        } catch (driveError) {
          this.logger.error('Failed to upload backup to Google Drive', driveError);
          // Continue even if Drive upload fails
        }
      }
      
      // Apply retention policy
      await this.applyRetentionPolicy();
      
      this.logger.log('Automatic backup completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Automatic backup failed', error);
      throw error;
    }
  }

  // Create a backup with all available models
  async createBackupAll() {
    try {
      this.logger.log('Starting full backup of all models');
      
      // Get all available models from Prisma
      const prismaModels = Object.keys(this.prisma)
        .filter(key => 
          typeof this.prisma[key] === 'object' && 
          this.prisma[key] !== null && 
          !key.startsWith('_') &&
          key !== '$connect' &&
          key !== '$disconnect' &&
          key !== '$on' &&
          key !== '$transaction' &&
          key !== '$use' &&
          key !== '$extends' &&
          // Add any other problematic models to exclude
          key !== 'AggregateUser' &&
          key !== 'GroupByUser' &&
          key !== 'UserGroupBy'
        );
      
      this.logger.log(`Found ${prismaModels.length} models to backup`);
      
      return this.createBackup(prismaModels);
    } catch (error) {
      this.logger.error('Error creating full backup', error);
      throw new InternalServerErrorException(`Failed to create full backup: ${error.message}`);
    }
  }

  // Get auto backup configuration
  async getAutoBackupConfig() {
    return this.autoBackupConfig;
  }

  // Update auto backup configuration
  async updateAutoBackupConfig(config: any) {
    // Validate configuration
    if (config.time && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(config.time)) {
      throw new BadRequestException('Invalid time format. Use HH:MM format (24-hour).');
    }
    
    // Update configuration
    this.autoBackupConfig = {
      ...this.autoBackupConfig,
      ...config
    };
    
    // Save to file
    this.saveAutoBackupConfig();
    
    // Update scheduled job if enabled
    if (this.autoBackupConfig.enabled) {
      this.setupAutoBackupJob();
    } else {
      // Remove job if disabled
      try {
        this.schedulerRegistry.deleteCronJob('autoBackup');
        this.logger.log('Automatic backup disabled');
      } catch (error) {
        // Job doesn't exist, that's ok
      }
    }
    
    return this.autoBackupConfig;
  }

  // Run backup right now and send to Google Drive
  async runBackupNow() {
    try {
      // Run the auto backup process
      const backupResult = await this.runAutoBackup();
      
      // Get auto backup config to check if we should upload to Drive
      const config = await this.getAutoBackupConfig();
      
      // If auto backup is enabled and we have a folder ID, upload to Google Drive
      if (config.driveFolderId && backupResult.filename) {
        try {
          const driveResult = await this.exportToDrive(
            backupResult.filename, 
            config.driveFolderId
          );
          
          return {
            ...backupResult,
            googleDrive: {
              success: true,
              fileId: driveResult.driveFileId,
              link: driveResult.driveLink
            }
          };
        } catch (driveError) {
          // Continue even if Drive upload fails
          return {
            ...backupResult,
            googleDrive: {
              success: false,
              error: driveError.message
            }
          };
        }
      }
      
      return backupResult;
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  // Apply backup retention policy
  private async applyRetentionPolicy() {
    try {
      const backups = await this.listBackups();
      const mappingsPath = path.join(process.cwd(), 'drive-mappings.json');
      let driveMappings = [];
      
      if (fs.existsSync(mappingsPath)) {
        driveMappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
      }
      
      // Apply retention to local backups
      if (backups.length > this.autoBackupConfig.retention) {
        backups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const backupsToDelete = backups.slice(0, backups.length - this.autoBackupConfig.retention);
        
        for (const backup of backupsToDelete) {
          // Delete from local filesystem
          await this.deleteBackup(backup.filename);
          this.logger.log(`Deleted old backup: ${backup.filename} (retention policy)`);
          
          // Delete from Google Drive if it exists there
          const driveMapping = driveMappings.find(m => m.localFilename === backup.filename);
          if (driveMapping && driveMapping.driveFileId) {
            try {
              await this.googleDriveService.deleteFile(driveMapping.driveFileId);
              this.logger.log(`Deleted backup from Google Drive: ${backup.filename}`);
              
              // Update mappings file by removing this entry
              const updatedMappings = driveMappings.filter(m => m.localFilename !== backup.filename);
              fs.writeFileSync(mappingsPath, JSON.stringify(updatedMappings, null, 2));
            } catch (driveError) {
              this.logger.error(`Failed to delete from Drive: ${backup.filename}`, driveError);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error applying backup retention policy', error);
    }
  }

  async createBackup(models: string[]) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;
      const backupPath = path.join(this.backupDir, filename);
      
      // Define data with a type that allows additional properties
      const data: { [key: string]: any } = {};
      const errors: string[] = [];
      
      // Extract data for each selected model
      for (const modelName of models) {
        try {
          // Check if model exists in Prisma client
          if (typeof this.prisma[modelName] === 'object' && this.prisma[modelName] !== null) {
            // Use Prisma client to fetch data from each model
            const modelData = await this.prisma[modelName].findMany();
            data[modelName] = modelData;
            this.logger.log(`Successfully backed up model: ${modelName} (${modelData.length} records)`);
          } else {
            this.logger.warn(`Skipping model ${modelName}: Not found in Prisma client`);
          }
        } catch (error) {
          // Log error but continue with other models
          this.logger.error(`Error backing up model ${modelName}:`, error);
          errors.push(`${modelName}: ${error.message}`);
        }
      }
      
      // Add metadata to backup
      const metadata = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        models: models.filter(m => data[m] !== undefined),
        recordCounts: {},
        errors: errors
      };
      
      // Add record counts for each model
      for (const modelName of Object.keys(data)) {
        if (modelName !== '_metadata') {
          metadata.recordCounts[modelName] = data[modelName]?.length || 0;
        }
      }
      
      // Add metadata to backup file
      data._metadata = metadata;
      
      // Write data to file
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      
      return {
        success: true,
        filename,
        models: metadata.models,
        timestamp,
        metadata,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      this.logger.error('Error creating backup', error);
      throw new InternalServerErrorException(`Failed to create backup: ${error.message}`);
    }
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
        'EditsInventory',
        'medAdministration',
        'dental_certificates',
        'medical_certificates',
        'opthal_certificates',
        'physical_exam',
        'appointment',
        'hsu_bulletin',
        'hsu_bulletin_files',
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
      if (modelName === 'hsu_bulletin') {
        // First delete files since they reference posts
        await prisma.hsu_bulletin_files.deleteMany({});
      } else if (modelName === 'consultation_records') {
        // First delete related diagnoses
        await prisma.consultation_diagnosis.deleteMany({});
        // And med administration records
        await prisma.medAdministration.deleteMany({});
      } else if (modelName === 'inventory') {
        // First delete related edits and med administration
        await prisma.EditsInventory.deleteMany({});
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
            'hsu_bulletin': 'hsu_bulletin',
            'hsu_bulletin_files': 'hsu_bulletin_files',
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

  async uploadBackupToDrive(filename: string, folderId: string): Promise<any> {
    const filePath = path.join(this.backupDir, filename);
    
    try {
      const uploadResult = await this.googleDriveService.uploadFile(filePath, filename, folderId);
      
      // Store the mapping between local filename and Drive fileId
      const driveMapping = {
        localFilename: filename,
        driveFileId: uploadResult.id,
        uploadedAt: new Date().toISOString()
      };
      
      // Store this mapping in a local file
      this.storeDriveMappings(driveMapping);
      
      return uploadResult;
    } catch (error) {
      this.logger.error(`Failed to upload backup to Drive: ${filename}`, error);
      throw error;
    }
  }

  private storeDriveMappings(mapping) {
    const mappingsPath = path.join(process.cwd(), 'drive-mappings.json');
    let mappings = [];
    
    try {
      if (fs.existsSync(mappingsPath)) {
        mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
      }
      mappings.push(mapping);
      fs.writeFileSync(mappingsPath, JSON.stringify(mappings, null, 2));
    } catch (error) {
      this.logger.error('Failed to store drive mappings', error);
    }
  }

  async backupModel(modelName: string): Promise<any> {
    try {
      // Check if the model exists in Prisma client
      if (!this.prisma[modelName] || typeof this.prisma[modelName].findMany !== 'function') {
        this.logger.warn(`Skipping model ${modelName}: Invalid or not accessible`);
        return [];
      }
      
      // Proceed with backup for valid models
      const records = await this.prisma[modelName].findMany();
      return records;
    } catch (error) {
      this.logger.error(`Error backing up model ${modelName}:`, error);
      return [];
    }
  }
}
