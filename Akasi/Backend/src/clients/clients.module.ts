import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaService } from '../prisma.service'; // If you have a PrismaService

@Module({ 
  imports: [],
  controllers: [ClientsController],
  providers: [ClientsService, PrismaService], // Add PrismaService if needed
})
export class ClientsModule {}
