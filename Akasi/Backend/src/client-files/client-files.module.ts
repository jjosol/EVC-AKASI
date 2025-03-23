import { Module } from '@nestjs/common';
import { ClientFilesController } from './client-files.controller';
import { ClientFilesService } from './client-files.service';
import { PrismaService } from '../prisma.service';

@Module({
    providers: [ClientFilesService, PrismaService],
    controllers: [ClientFilesController]
})
export class ClientFilesModule { }
