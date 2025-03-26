import { Module } from '@nestjs/common';
import { ClientFilesController } from './client-files.controller';
import { ClientFilesService } from './client-files.service';
import { PrismaService } from '../prisma.service';
import { ClientStatusModule } from '../client-status/client-status.module';
import { FileStatusModule } from '../file-status/file-status.module';

@Module({
    imports: [ClientStatusModule, FileStatusModule],
    providers: [ClientFilesService, PrismaService],
    controllers: [ClientFilesController],
    exports: [ClientFilesService],
})
export class ClientFilesModule { }
