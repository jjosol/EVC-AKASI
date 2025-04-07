import { Module } from '@nestjs/common';
import { ManagersService } from './managers.service';
import { ManagersController } from './managers.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [ManagersController],
    providers: [ManagersService, PrismaService],
    exports: [ManagersService],
})
export class ManagersModule { }
