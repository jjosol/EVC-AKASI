import { Module } from '@nestjs/common';
import { GetPatientConsultationsController } from './get-patient-consultations.controller';
import { GetPatientConsultationsService } from './get-patient-consultations.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [GetPatientConsultationsController],
    providers: [GetPatientConsultationsService, PrismaService]
})
export class GetPatientConsultationsModule { }
