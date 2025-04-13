// src/file-status/file-status.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FileStatusController } from './file-status.controller';
import { FileStatusService } from './file-status.service';
import { PatientStatusModule } from '../patient-status/patient-status.module';

@Module({
    imports: [PatientStatusModule], // Import the ClientStatusModule to get access to ClientStatusService
    controllers: [FileStatusController],
    providers: [FileStatusService, PrismaService],
    exports: [FileStatusService],
})
export class FileStatusModule { }