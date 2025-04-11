//app.module.ts
import { Module } from '@nestjs/common';
import { NurseModule } from './nurse/nurse.module'
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientModule } from './patient/patient.module';
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
import { DailyAppointmentModule } from './daily-appointment/daily-appointment.module';
import { EnrollmentDocumentsModule } from './enrollment-documents/enrollment-documents.module';
import { ReportsModule } from './reports/reports.module';
import { PatientFilesModule } from './patient-files/patient-files.module';
import { FetchPatientFilesModule } from './fetch-patient-files/fetch-patient-files.module';
import { GetPatientsModule } from './get-patients/get-patients.module';
import { FetchPatientFilesAdminModule } from './fetch-patient-files-admin/fetch-patient-files-admin.module';
import { FetchStaffFilesAdminModule } from './fetch-staff-files-admin/fetch-staff-files-admin.module';
import { FileStatusModule } from './file-status/file-status.module';
import { PatientStatusModule } from './patient-status/patient-status.module';
import { PatientFilesStaffModule } from './patient-files-staff/patient-files-staff.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { ManagersModule } from './managers/managers.module';
import { GetClientConsultationsModule } from './get-client-consultations/get-client-consultations.module';
import { BackupModule } from './backup/backup.module';
import { ChangePasswordModule } from './change-password/changePass.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EquipmentModule } from './equipment/equipment.module';


@Module({
  imports: [
    ChangePasswordModule, 
    BackupModule, 
    ReportsModule,
    PrismaModule,
    NurseModule,
    AuthModule,
    PatientModule,
    ConsultationRecordsModule,
    PostsModule,
    InventoryModule,
    MedAdministrationModule,
    StorageModule,
    FileModule,
    ProfileModule,
    AddAppointmentModule,
    FetchAppointmentsClientModule,
    DailyAppointmentModule,
    DailyAppointmentModule,
    EnrollmentDocumentsModule,
    PatientFilesModule,
    FetchPatientFilesModule,
    GetPatientsModule,
    FetchPatientFilesAdminModule,
    FetchStaffFilesAdminModule,
    FileStatusModule,
    PatientStatusModule,
    PatientFilesStaffModule,
    DiagnosisModule,
    ManagersModule,
    GetClientConsultationsModule,
    EquipmentModule
  ],
  providers: [AppService], // ONLY services directly used by AppModule
  controllers: [AppController], // ONLY controllers directly in AppModule
})
export class AppModule { }
