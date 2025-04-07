import { Module } from '@nestjs/common';
import { ClientFilesStaffController } from './client-files-staff.controller';
import { ClientFilesStaffService } from './client-files-staff.service';
import { PrismaModule } from '../prisma.module';
import { FileStatusModule } from '../file-status/file-status.module';
import { ClientStatusModule } from '../client-status/client-status.module';

@Module({
    imports: [
        PrismaModule,
        FileStatusModule,
        ClientStatusModule // Make sure this is imported
    ],
    controllers: [ClientFilesStaffController],
    providers: [ClientFilesStaffService],
    exports: [ClientFilesStaffService],
})
export class ClientFilesStaffModule { }