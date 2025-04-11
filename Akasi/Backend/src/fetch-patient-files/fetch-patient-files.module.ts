import { Module } from '@nestjs/common';
import { FetchPatientFilesController } from './fetch-patient-files.controller';
import { FetchPatientFilesService } from './fetch-patient-files.service';

@Module({
  controllers: [FetchPatientFilesController],
  providers: [FetchPatientFilesService]
})
export class FetchPatientFilesModule { }
