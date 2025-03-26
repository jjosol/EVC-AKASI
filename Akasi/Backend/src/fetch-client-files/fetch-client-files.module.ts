import { Module } from '@nestjs/common';
import { FetchClientFilesController } from './fetch-client-files.controller';
import { FetchClientFilesService } from './fetch-client-files.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [FetchClientFilesController],
  providers: [FetchClientFilesService, PrismaService]
})
export class FetchClientFilesModule { }
