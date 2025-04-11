import { Module } from '@nestjs/common';
import { PatientStatusService } from './patient-status.service';
import { PatientStatusController } from './patient-status.controller';

@Module({
    controllers: [PatientStatusController],
    providers: [PatientStatusService],
    exports: [PatientStatusService],
})
export class PatientStatusModule {}
