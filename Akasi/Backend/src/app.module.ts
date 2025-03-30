//app.module.ts
import { Module } from '@nestjs/common';
import { AdminsModule } from './admin/admins.module'
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ConsultationRecordsModule } from './consultation-records/consultation-records.module';
// import { TestModule } from './test/test.module';
import { PostsModule } from './posts/posts.module';
import { InventoryModule } from './inventory/inventory.module';
import { MedAdministrationModule } from './med-administration/med-administration.module';
import { StorageModule } from './storage/storage.module';
import { FileModule } from './file/file.module';
import { ProfileModule } from './profile/profile.module';
import { AddAppointmentModule } from './add-appointment/add-appointment.module';
import { FetchAppointmentsClientModule } from './fetch-appointments-client/fetch-appointments-client.module';
import { AdminFetchAppointmentsModule } from './admin-fetch-appointments/admin-fetch-appointments.module';
import { EnrollmentDocumentsModule } from './enrollment-documents/enrollment-documents.module';
import { ReportsModule } from './reports/reports.module';
import { ClientFilesModule } from './client-files/client-files.module';
import { FetchClientFilesModule } from './fetch-client-files/fetch-client-files.module';
import { GetClientsModule } from './get-clients/get-clients.module';
import { FetchClientFilesAdminModule } from './fetch-client-files-admin/fetch-client-files-admin.module';
import { FetchStaffFilesAdminModule } from './fetch-staff-files-admin/fetch-staff-files-admin.module';
import { FileStatusModule } from './file-status/file-status.module';
import { ClientStatusModule } from './client-status/client-status.module';
import { ClientFilesStaffModule } from './client-files-staff/client-files-staff.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { ManagersModule } from './managers/managers.module';
import { GetClientConsultationsModule } from './get-client-consultations/get-client-consultations.module';
import { BackupModule } from './backup/backup.module';
import { ChangePasswordModule } from './change-password/changePass.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ChangePasswordModule, 
    BackupModule, 
    ReportsModule,
    PrismaModule,
    AdminsModule,
    AuthModule,
    ClientsModule,
    ConsultationRecordsModule,
    PostsModule,
    InventoryModule,
    MedAdministrationModule,
    StorageModule,
    FileModule,
    ProfileModule,
    AddAppointmentModule,
    FetchAppointmentsClientModule,
    AdminFetchAppointmentsModule,
    EnrollmentDocumentsModule,
    ClientFilesModule,
    FetchClientFilesModule,
    GetClientsModule,
    FetchClientFilesAdminModule,
    FetchStaffFilesAdminModule,
    FileStatusModule,
    ClientStatusModule,
    ClientFilesStaffModule,
    DiagnosisModule,
    ManagersModule,
    GetClientConsultationsModule
  ],
  providers: [AppService], // ONLY services directly used by AppModule
  controllers: [AppController], // ONLY controllers directly in AppModule
})
export class AppModule { }
