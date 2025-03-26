import { Module } from '@nestjs/common';
import { GetClientsController } from './get-clients.controller';
import { GetClientsService } from './get-clients.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [GetClientsController],
  providers: [GetClientsService, PrismaService]
})
export class GetClientsModule { }
