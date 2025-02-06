// src/med-administration/med-administration.module.ts
import { Module } from '@nestjs/common';
import { MedAdministrationController } from './med-administration.controller';
import { MedAdministrationService } from './med-administration.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [MedAdministrationController],
  providers: [MedAdministrationService, PrismaService],
})
export class MedAdministrationModule {}
