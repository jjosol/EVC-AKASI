//app.module.ts
import { Module } from '@nestjs/common';
import { AdminsModule } from './admin/admins.module'
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
import { StorageService } from './storage/storage.service';
import { StorageModule } from './storage/storage.module';
import { FileController } from './file/file.controller';
import { FileService } from './file/file.service';
import { FileModule } from './file/file.module';
import { ProfileService } from './profile/profile.service';
import { ProfileModule } from './profile/profile.module';
import { ProfileController } from './profile/profile.controller';
import { AddAppointmentController } from './add-appointment/add-appointment.controller';
import { AddAppointmentService } from './add-appointment/add-appointment.service';
import { AddAppointmentModule } from './add-appointment/add-appointment.module';
import { FetchAppointmentsClientModule } from './fetch-appointments-client/fetch-appointments-client.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminFetchAppointmentsController } from './admin-fetch-appointments/admin-fetch-appointments.controller';
import { AdminFetchAppointmentsService } from './admin-fetch-appointments/admin-fetch-appointments.service';
import { AdminFetchAppointmentsModule } from './admin-fetch-appointments/admin-fetch-appointments.module';
import { EnrollmentDocumentsController } from './enrollment-documents/enrollment-documents.controller';
import { EnrollmentDocumentsService } from './enrollment-documents/enrollment-documents.service';
import { EnrollmentDocumentsModule } from './enrollment-documents/enrollment-documents.module';


@Module({
  imports: [PrismaModule, AdminsModule, AuthModule, ClientsModule, ConsultationRecordsModule, PostsModule, InventoryModule, MedAdministrationModule, StorageModule, FileModule, ProfileModule, AddAppointmentModule, FetchAppointmentsClientModule, AdminFetchAppointmentsModule, EnrollmentDocumentsModule],
  providers: [AppService, PostsService, MedAdministrationService, StorageService, FileService, ProfileService, AddAppointmentService, AdminFetchAppointmentsService, EnrollmentDocumentsService],
  controllers: [AppController, PostsController, MedAdministrationController, FileController, ProfileController, AddAppointmentController, AdminFetchAppointmentsController, EnrollmentDocumentsController],
})
export class AppModule { }
