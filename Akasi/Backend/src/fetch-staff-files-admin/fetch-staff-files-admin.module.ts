import { Module } from '@nestjs/common';
import { FetchStaffFilesAdminController } from './fetch-staff-files-admin.controller';
import { FetchStaffFilesAdminService } from './fetch-staff-files-admin.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [FetchStaffFilesAdminController],
    providers: [FetchStaffFilesAdminService, PrismaService]
})
export class FetchStaffFilesAdminModule { }
