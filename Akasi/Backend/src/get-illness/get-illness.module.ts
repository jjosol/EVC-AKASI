import { Module } from '@nestjs/common';
import { GetIllnessController } from './get-illness.controller';
import { GetIllnessService } from './get-illness.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [GetIllnessController],
  providers: [GetIllnessService, PrismaService]
})
export class GetPatientModule { }
