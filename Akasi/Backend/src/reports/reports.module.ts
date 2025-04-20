import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma.service';
import { GetIllnessService } from '../get-illness/get-illness.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService, GetIllnessService],
})
export class ReportsModule {}