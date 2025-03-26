import { Module } from '@nestjs/common';
import { FetchClientFilesAdminController } from './fetch-client-files-admin.controller';
import { FetchClientFilesAdminService } from './fetch-client-files-admin.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule], // Import PrismaModule to provide PrismaService
  controllers: [FetchClientFilesAdminController],
  providers: [FetchClientFilesAdminService]
})
export class FetchClientFilesAdminModule {}
