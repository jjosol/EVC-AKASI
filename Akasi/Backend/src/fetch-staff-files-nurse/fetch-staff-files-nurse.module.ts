import { Module } from '@nestjs/common';
import { FetchStaffFilesNurseController } from './fetch-staff-files-nurse.controller';
import { FetchStaffFilesNurseService } from './fetch-staff-files-nurse.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [FetchStaffFilesNurseController],
    providers: [FetchStaffFilesNurseService, PrismaService]
})
export class FetchStaffFilesAdminModule { }
