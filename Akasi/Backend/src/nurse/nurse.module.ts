import { Module } from '@nestjs/common';
import { NurseController } from './nurse.controller';
import { NurseService } from './nurse.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [NurseController],
    providers: [NurseService, PrismaService],
})
export class NurseModule {}
