// src/med-administration/med-administration.module.ts
import { Module } from '@nestjs/common';
import { MedAdministrationController } from './med-administration.controller';
import { MedAdministrationService } from './med-administration.service';
import { PrismaService } from '../prisma.service';
import { InventoryModule } from '../inventory/inventory.module'; // Add this import

@Module({
  imports: [InventoryModule], // Add this to import InventoryModule
  controllers: [MedAdministrationController],
  providers: [MedAdministrationService, PrismaService],
  exports: [MedAdministrationService]
})
export class MedAdministrationModule {}
