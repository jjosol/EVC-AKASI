import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { PrismaService } from '../prisma.service'; // If you have a PrismaService

@Module({ 
  imports: [],
  controllers: [PatientController],
  providers: [PatientService, PrismaService], // Add PrismaService if needed
})
export class PatientModule {}
