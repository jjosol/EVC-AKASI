import { Module } from '@nestjs/common';
import { MedAdministrationController } from './med-administration.controller';
import { MedAdministrationService } from './med-administration.service';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service'
import { InventoryModule } from '../inventory/inventory.module'

@Module({
  controllers: [MedAdministrationController],
  providers: [MedAdministrationService, PrismaService, InventoryService],
  imports: [InventoryModule]
})
export class MedAdministrationModule {}
