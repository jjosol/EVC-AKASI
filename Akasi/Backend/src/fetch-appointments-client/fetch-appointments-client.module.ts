import { Module } from '@nestjs/common';
import { FetchAppointmentsClientService } from './fetch-appointments-client.service';
import { FetchAppointmentsClientController } from './fetch-appointments-client.controller';

@Module({
  providers: [FetchAppointmentsClientService],
  controllers: [FetchAppointmentsClientController]
})
export class FetchAppointmentsClientModule { }
