import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { PrismaService } from '../prisma.service';
import { StorageModule } from '../storage/storage.module'; // Import StorageModule

@Module({
  imports: [StorageModule], // Add StorageModule here
  controllers: [FileController],
  providers: [FileService, PrismaService],
})
export class FileModule {}
