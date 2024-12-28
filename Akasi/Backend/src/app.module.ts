//app.module.ts
import { Module } from '@nestjs/common';
import {AdminsModule} from './admin/admins.module'
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ConsultationRecordsModule } from './consultation-records/consultation-records.module';
// import { TestModule } from './test/test.module';
import { PostsService } from './posts/posts.service';
import { PostsController } from './posts/posts.controller';
import { PostsModule } from './posts/posts.module';
import { InventoryModule } from './inventory/inventory.module';
import { MedAdministrationController } from './med-administration/med-administration.controller';
import { MedAdministrationService } from './med-administration/med-administration.service';
import { MedAdministrationModule } from './med-administration/med-administration.module';

@Module({
  imports: [PrismaModule, AdminsModule, AuthModule, ClientsModule, ConsultationRecordsModule, PostsModule, InventoryModule, MedAdministrationModule],
  providers: [PostsService, MedAdministrationService],
  controllers: [PostsController, MedAdministrationController],
})
export class AppModule {}
