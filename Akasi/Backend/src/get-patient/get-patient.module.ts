import { Module } from '@nestjs/common';
import { GetPatientController } from './get-patient.controller';
import { GetPatientService } from './get-patient.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [GetPatientController],
  providers: [GetPatientService, PrismaService]
})
export class GetPatientModule { }
