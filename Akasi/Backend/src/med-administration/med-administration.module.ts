// src/med-administration/med-administration.module.ts
import { Module } from '@nestjs/common';
import { MedAdministrationController } from './med-administration.controller';
import { MedAdministrationService } from './med-administration.service';
import { PrismaService } from '../prisma.service';
import { MedicineModule } from '../medicine/medicine.module'; // Medicine Module import

@Module({
  imports: [MedicineModule], // Import MedicineModule to use MedicineService
  controllers: [MedAdministrationController],
  providers: [MedAdministrationService, PrismaService],
  exports: [MedAdministrationService]
})
export class MedAdministrationModule {}
