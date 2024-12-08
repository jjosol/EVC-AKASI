//consultation-records.module.ts
import { Module } from '@nestjs/common';
import { ConsultationRecordsService } from './consultation-records.service';
import { ConsultationRecordsController } from './consultation-records.controller';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';

@Module({
  controllers: [ConsultationRecordsController],
  providers: [ConsultationRecordsService, PrismaService, InventoryService],
})
export class ConsultationRecordsModule {}
