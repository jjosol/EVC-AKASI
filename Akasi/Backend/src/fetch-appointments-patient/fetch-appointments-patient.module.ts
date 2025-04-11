import { Module } from '@nestjs/common';
import { FetchAppointmentsPatientService } from './fetch-appointments-patient.service';
import { FetchAppointmentsPatientController } from './fetch-appointments-patient.controller';

@Module({
  providers: [FetchAppointmentsPatientService],
  controllers: [FetchAppointmentsPatientController]
})
export class FetchAppointmentsPatientModule { }
