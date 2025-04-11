import { Module } from '@nestjs/common';
import { PatientFilesStaffController } from './patient-files-staff.controller';
import { PatientFilesStaffService } from './patient-files-staff.service';
import { PrismaModule } from '../prisma.module';
import { FileStatusModule } from '../file-status/file-status.module';
import { PatientStatusModule } from '../patient-status/patient-status.module';

@Module({
    imports: [
        PrismaModule,
        FileStatusModule,
        PatientStatusModule
    ],
    controllers: [PatientFilesStaffController],
    providers: [PatientFilesStaffService],
    exports: [PatientFilesStaffService],
})
export class PatientFilesStaffModule { }