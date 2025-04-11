import { Module } from '@nestjs/common';
import { FetchPatientFilesNurseController } from './fetch-patient-files-nurse.controller';
import { FetchPatientFilesNurseService } from './fetch-patient-files-nurse.service';

@Module({
    controllers: [FetchPatientFilesNurseController],
    providers: [FetchPatientFilesNurseService]
})
export class FetchPatientFilesNurseModule { }
