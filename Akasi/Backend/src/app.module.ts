// app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { AdminsModule } from './admin/admins.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ConsultationRecordsModule } from './consultation-records/consultation-records.module';
import { InventoryModule } from './inventory/inventory.module';
import { MedAdministrationModule } from './med-administration/med-administration.module';

@Module({
  imports: [
    PrismaModule, 
    AdminsModule, 
    AuthModule, 
    ClientsModule, 
    ConsultationRecordsModule, 
    InventoryModule, 
    MedAdministrationModule
  ],
})
export class AppModule {}
