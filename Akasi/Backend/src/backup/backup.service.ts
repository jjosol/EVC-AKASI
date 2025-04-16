import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleDriveService } from './google-drive.service';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class BackupService {
  private readonly backupDir = path.join(process.cwd(), 'backups');
  private readonly filesDir = path.join(process.cwd(), 'uploaded_files');
  private readonly logger = new Logger(BackupService.name);
  private autoBackupConfig = {
    enabled: false,
    frequency: 'daily', // daily, weekly, monthly
    time: '00:00', // HH:MM format
    driveFolderId: '', // Google Drive folder ID
    retention: 7, // Number of backups to keep
    includeFiles: true // Whether to include uploaded files in backup
  };
  private autoBackupConfigPath = path.join(process.cwd(), 'auto-backup-config.json');
  private cronExpression: string;
  private cronEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleDriveService: GoogleDriveService,
    private schedulerRegistry: SchedulerRegistry
  ) {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    // Create files backup directory if it doesn't exist
    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
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
      // Skip the custom scheduling approach and use dynamic cron expression
      // with a class property that the @Cron decorator can use
      
      // Parse time from HH:MM format
      const [hours, minutes] = this.autoBackupConfig.time.split(':').map(Number);
      
      // Create cron expression based on frequency
      switch(this.autoBackupConfig.frequency) {
        case 'daily':
          this.cronExpression = `${minutes} ${hours} * * *`;
          break;
        case 'weekly':
          this.cronExpression = `${minutes} ${hours} * * 0`; // Sunday
          break;
        case 'monthly':
          this.cronExpression = `${minutes} ${hours} 1 * *`; // 1st of month
          break;
        default:
          this.cronExpression = `${minutes} ${hours} * * *`; // Default to daily
      }
      
      this.cronEnabled = this.autoBackupConfig.enabled;
      
      this.logger.log(`Auto backup scheduled: ${this.autoBackupConfig.frequency} at ${this.autoBackupConfig.time}`);
    } catch (error) {
      this.logger.error('Error setting up auto backup job', error);
    }
  }

  // Dynamic cron job using the built-in NestJS scheduler
  @Cron('* * * * *', { name: 'autoBackup' })
  async dynamicAutomaticBackup() {
    // Only run if auto backup is enabled and we have a cron expression
    if (this.cronEnabled && this.cronExpression) {
      // Check if this minute matches our schedule
      const now = new Date();
      const cronParts = this.cronExpression.split(' ');
      const minute = cronParts[0] === '*' ? true : cronParts[0] === now.getMinutes().toString();
      const hour = cronParts[1] === '*' ? true : cronParts[1] === now.getHours().toString();
      const day = cronParts[2] === '*' ? true : cronParts[2] === now.getDate().toString();
      const month = cronParts[3] === '*' ? true : cronParts[3] === (now.getMonth() + 1).toString();
      const dayOfWeek = cronParts[4] === '*' ? true : cronParts[4] === now.getDay().toString();
      
      if (minute && hour && day && month && dayOfWeek) {
        await this.runAutoBackup();
      }
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
  async createBackupAll(options?: { gradeLevel?: number, division?: string }) {
    try {
      if (options?.gradeLevel || options?.division) {
        this.logger.log(`Starting selective backup: ${options.gradeLevel ? `Grade ${options.gradeLevel}` : ''}${options.division ? ` Division: ${options.division}` : ''}`);
      } else {
        this.logger.log('Starting full backup of all models');
      }
      
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
      
      return this.createBackup(prismaModels, options);
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
      // Create backup of all models directly (don't call runAutoBackup which would create an extra backup)
      const backupResult = await this.createBackupAll();
      
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
      
      // Apply retention policy
      await this.applyRetentionPolicy();
      
      return backupResult;
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  // Apply backup retention policy
  private async applyRetentionPolicy() {
    try {
      const backups = await this.listBackups();
      
      // If we have more backups than the retention limit
      if (backups.length > this.autoBackupConfig.retention) {
        // Sort by date (oldest first)
        backups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Delete oldest backups that exceed retention limit
        const backupsToDelete = backups.slice(0, backups.length - this.autoBackupConfig.retention);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.filename);
          this.logger.log(`Deleted old backup: ${backup.filename} (retention policy)`);
        }
      }
    } catch (error) {
      this.logger.error('Error applying backup retention policy', error);
    }
  }

  async createBackup(models: string[], options?: { gradeLevel?: number, division?: string }) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filename = `backup-${timestamp}.json`;
      
      // Add identifiers for selective backup
      if (options?.gradeLevel) {
        filename = `backup-grade${options.gradeLevel}-${timestamp}.json`;
      } else if (options?.division) {
        filename = `backup-${options.division.replace(/\s+/g, '-')}-${timestamp}.json`;
      }
      
      const backupPath = path.join(this.backupDir, filename);
      
      // Define data with a type that allows additional properties
      const data: { [key: string]: any } = {};
      const errors: string[] = [];
      
      // Track file-related models for special handling
      const fileModels = [
        'prescription', 'dental_certificates', 'medical_certificates', 
        'opthal_certificates', 'physical_exam', 'medical_consent', 
        'dental_consent', 'dental_history', 'hh_pds', 'laboratory',
        'hsu_bulletin_files'
      ];
      
      // Extract data for each selected model
      for (const modelName of models) {
        try {
          // Check if model exists in Prisma client
          if (typeof this.prisma[modelName] === 'object' && this.prisma[modelName] !== null) {
            // For patient model with filtering options
            if (modelName === 'patient' && (options?.gradeLevel !== undefined || options?.division !== undefined)) {
              const filter: any = {};
              
              if (options.gradeLevel !== undefined) {
                filter.grade = options.gradeLevel;
              }
              
              if (options.division !== undefined) {
                filter.division = options.division;
              }
              
              const modelData = await this.prisma[modelName].findMany({
                where: filter
              });
              
              // If we're doing a filtered backup, also collect the IDs to filter related records
              if (modelData.length > 0) {
                const patientIds = modelData.map(p => p.patient_id);
                
                // Store the patient data
                data[modelName] = modelData;
                this.logger.log(`Successfully backed up model: ${modelName} (${modelData.length} records with filter: ${JSON.stringify(filter)})`);
                
                // For filtered backups, also get related patient data instead of entire tables
                if (patientIds.length > 0) {
                  // Handle related patient models separately
                  const relatedModels = [
                    'appointment', 'consultation_records', 'dental_certificates', 
                    'medical_certificates', 'opthal_certificates', 'physical_exam',
                    'medical_consent', 'dental_consent', 'dental_history', 
                    'hh_pds', 'laboratory', 'medAdministration'
                  ];
                  
                  for (const relatedModel of relatedModels) {
                    if (models.includes(relatedModel)) {
                      try {
                        const relatedData = await this.prisma[relatedModel].findMany({
                          where: {
                            patient_id: { in: patientIds }
                          }
                        });
                        
                        data[relatedModel] = relatedData;
                        this.logger.log(`Successfully backed up related model: ${relatedModel} (${relatedData.length} records)`);
                        
                        // Special handling for consultation records to get related data
                        if (relatedModel === 'consultation_records' && relatedData.length > 0) {
                          const consultationIds = relatedData.map(c => c.consultation_id);
                          
                          // Get related consultation diagnoses
                          if (models.includes('consultation_diagnosis')) {
                            const diagnosisData = await this.prisma.consultation_diagnosis.findMany({
                              where: {
                                consultation_id: { in: consultationIds }
                              }
                            });
                            data['consultation_diagnosis'] = diagnosisData;
                            this.logger.log(`Successfully backed up related model: consultation_diagnosis (${diagnosisData.length} records)`);
                          }
                          
                          // Get related prescriptions
                          if (models.includes('prescription')) {
                            const prescriptionData = await this.prisma.prescription.findMany({
                              where: {
                                consultation_id: { in: consultationIds }
                              }
                            });
                            data['prescription'] = prescriptionData;
                            this.logger.log(`Successfully backed up related model: prescription (${prescriptionData.length} records)`);
                          }
                        }
                      } catch (error) {
                        this.logger.error(`Error backing up related model ${relatedModel}:`, error);
                        errors.push(`${relatedModel}: ${error.message}`);
                      }
                    }
                  }
                }
              } else {
                data[modelName] = [];
                this.logger.warn(`No records found for model: ${modelName} with filter: ${JSON.stringify(filter)}`);
              }
            } else {
              // Regular case for non-patient models or when not filtering
              const modelData = await this.prisma[modelName].findMany();
              
              // For models with file paths, include file existence information
              if (fileModels.includes(modelName)) {
                for (const record of modelData) {
                  if (record.file_path && fs.existsSync(record.file_path)) {
                    // Add file metadata but not the content
                    record._fileExists = true;
                    record._fileSize = record.file_size || fs.statSync(record.file_path).size;
                  }
                }
              }
              
              data[modelName] = modelData;
              this.logger.log(`Successfully backed up model: ${modelName} (${modelData.length} records)`);
            }
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
        version: '1.2', // Updated version
        timestamp: new Date().toISOString(),
        models: models.filter(m => data[m] !== undefined),
        recordCounts: {},
        errors: errors,
        includesFiles: this.autoBackupConfig.includeFiles,
        selective: options ? {
          gradeLevel: options.gradeLevel,
          division: options.division
        } : null
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
        // Categories first
        'medicineCategory', 
        'equipmentCategory',
        'diagnosis_category',
        
        // User roles
        'doctor',
        'nurse',
        'patient',
        
        // Assets and inventory
        'medicine',
        'equipment',
        
        // Records
        'consultation_records',
        'diagnosis',
        'prescription',
        'consultation_diagnosis',
        
        // Edits history
        'EditsMedicine',
        'EditsEquipment',
        
        // Administration
        'medAdministration',
        
        // Certificates and forms
        'dental_certificates',
        'medical_certificates',
        'opthal_certificates',
        'physical_exam',
        'medical_consent',
        'dental_consent',
        'dental_history',
        'hh_pds',
        'laboratory',
        
        // Appointments
        'appointment',
        
        // Bulletin
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
      switch(modelName) {
        case 'hsu_bulletin':
          // First delete files since they reference posts
          await prisma.hsu_bulletin_files.deleteMany({});
          break;
        case 'consultation_records':
          // First delete related records
          await prisma.consultation_diagnosis.deleteMany({});
          await prisma.medAdministration.deleteMany({});
          await prisma.prescription.deleteMany({});
          break;
        case 'medicine':
          // First delete related records
          await prisma.medAdministration.deleteMany({});
          await prisma.EditsMedicine.deleteMany({});
          await prisma.prescription.deleteMany({});
          break;
        case 'equipment':
          // Delete related equipment edits
          await prisma.EditsEquipment.deleteMany({});
          break;
        case 'patient':
          // Delete all patient-related records
          await prisma.appointment.deleteMany({});
          await prisma.consultation_records.deleteMany({});
          await prisma.medAdministration.deleteMany({});
          await prisma.dental_certificates.deleteMany({});
          await prisma.medical_certificates.deleteMany({});
          await prisma.opthal_certificates.deleteMany({});
          await prisma.physical_exam.deleteMany({});
          await prisma.medical_consent.deleteMany({});
          await prisma.dental_consent.deleteMany({});
          await prisma.dental_history.deleteMany({});
          await prisma.hh_pds.deleteMany({});
          await prisma.laboratory.deleteMany({});
          break;
        case 'nurse':
          // Delete nurse-related records
          await prisma.consultation_records.deleteMany({});
          await prisma.medAdministration.deleteMany({});
          await prisma.EditsEquipment.deleteMany({});
          await prisma.EditsMedicine.deleteMany({});
          await prisma.hsu_bulletin.deleteMany({});
          break;
        case 'doctor':
          // Delete doctor-related records
          await prisma.consultation_records.deleteMany({});
          await prisma.medAdministration.deleteMany({});
          break;
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
      doctor: {
        doctor_id: record.doctor_id,
        username: record.username,
      },
      nurse: {
        nurse_id: record.nurse_id,
        username: record.username,
      },
      patient: {
        patient_id: record.patient_id,
        username: record.username,
      },
      medicine: {
        medicine_id: record.medicine_id,
        medName: record.medName,
      },
      consultation_records: {
        consultation_id: record.consultation_id,
      },
      consultation_diagnosis: {
        consultation_id: record.consultation_id,
        diagnosis_id: record.diagnosis_id,
      },
      medAdministration: {
        med_administration_id: record.med_administration_id,
      },
      prescription: {
        prescription_id: record.prescription_id,
      },
      equipment: {
        equipment_id: record.equipment_id,
      },
      hsu_bulletin: {
        post_id: record.post_id,
      },
      hsu_bulletin_files: {
        file_id: record.file_id,
      },
      dental_certificates: {
        dental_id: record.dental_id,
      },
      medical_certificates: {
        medical_id: record.medical_id,
      },
      opthal_certificates: {
        opthal_id: record.opthal_id,
      },
      physical_exam: {
        physical_id: record.physical_id,
      },
      medical_consent: {
        medical_consent_id: record.medical_consent_id,
      },
      dental_consent: {
        dental_consent_id: record.dental_consent_id,
      },
      dental_history: {
        dental_history_id: record.dental_history_id,
      },
      hh_pds: {
        hh_pds_id: record.hh_pds_id,
      },
      laboratory: {
        laboratory_id: record.laboratory_id,
      },
      // Add other models as needed
    };
    
    // Default to ID-based primary key if not specifically defined
    if (!primaryKeys[modelName]) {
      if (record.id) return { id: record.id };
      
      // Try common ID patterns
      const possibleIdFields = [
        `${modelName}_id`,
        `${modelName.toLowerCase()}_id`,
        `${modelName}Id`
      ];
      
      for (const field of possibleIdFields) {
        if (record[field] !== undefined) {
          return { [field]: record[field] };
        }
      }
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
            'doctor': 'doctor',
            'nurse': 'nurse',
            'patient': 'patient',
            'medicine': 'medicine',
            'medicineCategory': 'medicineCategory',
            'equipment': 'equipment',
            'equipmentCategory': 'equipmentCategory',
            'consultation_records': 'consultation_records',
            'diagnosis': 'diagnosis',
            'diagnosis_category': 'diagnosis_category',
            'consultation_diagnosis': 'consultation_diagnosis',
            'medAdministration': 'medAdministration',
            'EditsMedicine': 'EditsMedicine',
            'EditsEquipment': 'EditsEquipment',
            'prescription': 'prescription',
            'dental_certificates': 'dental_certificates',
            'medical_certificates': 'medical_certificates',
            'opthal_certificates': 'opthal_certificates',
            'physical_exam': 'physical_exam',
            'medical_consent': 'medical_consent',
            'dental_consent': 'dental_consent',
            'dental_history': 'dental_history',
            'hh_pds': 'hh_pds',
            'laboratory': 'laboratory',
            'hsu_bulletin': 'hsu_bulletin',
            'hsu_bulletin_files': 'hsu_bulletin_files',
            'appointment': 'appointment',
          };

          const tableName = tableMapping[modelName] || modelName;
          
          // Determine the appropriate ID column name based on model
          let idColumnName;
          
          switch(modelName) {
            case 'doctor':
              idColumnName = 'doctor_id';
              break;
            case 'nurse':
              idColumnName = 'nurse_id';
              break;
            case 'patient':
              idColumnName = 'patient_id';
              break;
            case 'medicine':
              idColumnName = 'medicine_id';
              break;
            case 'medicineCategory':
              idColumnName = 'medCategory_id';
              break;
            case 'equipmentCategory':
              idColumnName = 'medCategory_id';
              break;
            case 'equipment':
              idColumnName = 'equipment_id';
              break;
            case 'consultation_records':
              idColumnName = 'consultation_id';
              break;
            case 'diagnosis':
              idColumnName = 'diagnosis_id';
              break;
            case 'diagnosis_category':
              idColumnName = 'category_id';
              break;
            case 'medAdministration':
              idColumnName = 'med_administration_id';
              break;
            case 'EditsMedicine':
              idColumnName = 'edit_id';
              break;
            case 'EditsEquipment':
              idColumnName = 'edit_id';
              break;
            case 'prescription':
              idColumnName = 'prescription_id';
              break;
            case 'dental_certificates':
              idColumnName = 'dental_id';
              break;
            case 'medical_certificates':
              idColumnName = 'medical_id';
              break;
            case 'opthal_certificates':
              idColumnName = 'opthal_id';
              break;
            case 'physical_exam':
              idColumnName = 'physical_id';
              break;
            case 'medical_consent':
              idColumnName = 'medical_consent_id';
              break;
            case 'dental_consent':
              idColumnName = 'dental_consent_id';
              break;
            case 'dental_history':
              idColumnName = 'dental_history_id';
              break;
            case 'hh_pds':
              idColumnName = 'hh_pds_id';
              break;
            case 'laboratory':
              idColumnName = 'laboratory_id';
              break;
            case 'hsu_bulletin':
              idColumnName = 'post_id';
              break;
            case 'hsu_bulletin_files':
              idColumnName = 'file_id';
              break;
            case 'appointment':
              idColumnName = 'appointment_id';
              break;
            default:
              idColumnName = `${modelName}_id`;
          }
          
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
