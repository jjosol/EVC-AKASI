import { Module } from '@nestjs/common';
import { PatientFilesController } from './patient-files.controller';
import { PatientFilesService } from './patient-files.service';
import { PrismaService } from '../prisma.service';
import { PatientStatusModule } from '../patient-status/patient-status.module';
import { FileStatusModule } from '../file-status/file-status.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [PatientStatusModule, FileStatusModule, StorageModule],
    providers: [PatientFilesService, PrismaService],
    controllers: [PatientFilesController],
    exports: [PatientFilesService],
})
export class PatientFilesModule { }
