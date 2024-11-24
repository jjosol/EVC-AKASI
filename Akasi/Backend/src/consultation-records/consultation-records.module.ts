//consultation-records.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConsultationRecordsService } from './consultation-records.service';
import { ConsultationRecordsController } from './consultation-records.controller';

@Module({
  controllers: [ConsultationRecordsController],
  providers: [ConsultationRecordsService, PrismaService],
})
export class ConsultationRecordsModule {}
