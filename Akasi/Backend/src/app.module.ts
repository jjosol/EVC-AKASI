//app.module.ts
import { Module } from '@nestjs/common';
import {AdminsModule} from './admin/admins.module'
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ConsultationRecordsModule } from './consultation-records/consultation-records.module';
import { TestModule } from './test/test.module';
@Module({
  imports: [AdminsModule, AuthModule, ClientsModule, ConsultationRecordsModule, TestModule],
})
export class AppModule {}
