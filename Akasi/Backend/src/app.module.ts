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
import { ClientFilesModule } from './client-files/client-files.module';
import { FetchClientFilesService } from './fetch-client-files/fetch-client-files.service';
import { FetchClientFilesModule } from './fetch-client-files/fetch-client-files.module';
import { GetClientsService } from './get-clients/get-clients.service';
import { GetClientsModule } from './get-clients/get-clients.module';
import { FetchClientFilesAdminService } from './fetch-client-files-admin/fetch-client-files-admin.service';
import { FetchClientFilesAdminController } from './fetch-client-files-admin/fetch-client-files-admin.controller';
import { FetchClientFilesAdminModule } from './fetch-client-files-admin/fetch-client-files-admin.module';
import { FetchStaffFilesAdminService } from './fetch-staff-files-admin/fetch-staff-files-admin.service';
import { FetchStaffFilesAdminController } from './fetch-staff-files-admin/fetch-staff-files-admin.controller';
import { FetchStaffFilesAdminModule } from './fetch-staff-files-admin/fetch-staff-files-admin.module';
import { FileStatusService } from './file-status/file-status.service';
import { FileStatusController } from './file-status/file-status.controller';
import { FileStatusModule } from './file-status/file-status.module';
import { ClientStatusService } from './client-status/client-status.service';
import { ClientStatusController } from './client-status/client-status.controller';
import { ClientStatusModule } from './client-status/client-status.module';
import { ClientFilesStaffService } from './client-files-staff/client-files-staff.service';
import { ClientFilesStaffController } from './client-files-staff/client-files-staff.controller';
import { ClientFilesStaffModule } from './client-files-staff/client-files-staff.module';

@Module({
  imports: [PrismaModule, AdminsModule, AuthModule, ClientsModule, ConsultationRecordsModule, PostsModule, InventoryModule, MedAdministrationModule, StorageModule, FileModule, ProfileModule, AddAppointmentModule, FetchAppointmentsClientModule, AdminFetchAppointmentsModule, EnrollmentDocumentsModule, ClientFilesModule, FetchClientFilesModule, GetClientsModule, FetchClientFilesAdminModule, FetchStaffFilesAdminModule, FileStatusModule, ClientStatusModule, ClientFilesStaffModule],
  providers: [AppService, PostsService, MedAdministrationService, StorageService, FileService, ProfileService, AddAppointmentService, AdminFetchAppointmentsService, EnrollmentDocumentsService, FetchClientFilesService, GetClientsService, FetchClientFilesAdminService, FetchStaffFilesAdminService, FileStatusService, ClientStatusService, ClientFilesStaffService],
  controllers: [AppController, PostsController, MedAdministrationController, FileController, ProfileController, AddAppointmentController, AdminFetchAppointmentsController, EnrollmentDocumentsController, FetchClientFilesAdminController, FetchStaffFilesAdminController, FileStatusController, ClientStatusController, ClientFilesStaffController],
})
export class AppModule { }
