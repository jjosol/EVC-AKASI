import { Module, OnModuleInit } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { GoogleDriveService } from './google-drive.service';
import { PrismaService } from '../prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaModule } from '../prisma.module';
import { ScheduleModule } from '@nestjs/schedule'; // Add this import

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads');
          // Create directory if it doesn't exist
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
    PrismaModule,
    ScheduleModule.forRoot(), // Add this line to import the ScheduleModule
  ],
  controllers: [BackupController],
  providers: [BackupService, GoogleDriveService],
  exports: [BackupService, GoogleDriveService],
})
export class BackupModule implements OnModuleInit {
  onModuleInit() {
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    }
  }
}
