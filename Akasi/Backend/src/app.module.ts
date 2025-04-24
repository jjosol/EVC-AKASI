//app.module.ts
import { Module } from '@nestjs/common';
import { NurseModule } from './nurse/nurse.module'
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientModule } from './patient/patient.module';
import { ConsultationRecordsModule } from './consultation-records/consultation-records.module';
// import { TestModule } from './test/test.module';
import { PostsModule } from './posts/posts.module';
import { MedicineModule } from './medicine/medicine.module';
import { MedAdministrationModule } from './med-administration/med-administration.module';
import { StorageModule } from './storage/storage.module';
import { FileModule } from './file/file.module';
import { ProfileModule } from './profile/profile.module';
import { AddAppointmentModule } from './add-appointment/add-appointment.module';
import { FetchAppointmentsPatientModule } from './fetch-appointments-patient/fetch-appointments-patient.module';
import { DailyAppointmentModule } from './daily-appointment/daily-appointment.module';
import { EnrollmentDocumentsModule } from './enrollment-documents/enrollment-documents.module';
import { ReportsModule } from './reports/reports.module';
import { PatientFilesModule } from './patient-files/patient-files.module';
import { FetchPatientFilesModule } from './fetch-patient-files/fetch-patient-files.module';
import { GetPatientModule } from './get-patient/get-patient.module';
import { FetchPatientFilesNurseModule } from './fetch-patient-files-nurse/fetch-patient-files-nurse.module';
import { FetchStaffFilesAdminModule } from './fetch-staff-files-nurse/fetch-staff-files-nurse.module';
import { FileStatusModule } from './file-status/file-status.module';
import { PatientStatusModule } from './patient-status/patient-status.module';
import { PatientFilesStaffModule } from './patient-files-staff/patient-files-staff.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { GetPatientConsultationsModule } from './get-patient-consultations/get-patient-consultations.module';
import { BackupModule } from './backup/backup.module';
import { ChangePasswordModule } from './change-password/changePass.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EquipmentModule } from './equipment/equipment.module';
import { DoctorService } from './doctor/doctor.service';
import { DoctorController } from './doctor/doctor.controller';
import { DoctorModule } from './doctor/doctor.module';
import { ChiefComplaintController } from './chief-complaint/chief-complaint.controller';
import { ChiefComplaintService } from './chief-complaint/chief-complaint.service';
import { ChiefComplaintModule } from './chief-complaint/chief-complaint.module';


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
    MedicineModule,
    MedAdministrationModule,
    StorageModule,
    FileModule,
    ProfileModule,
    AddAppointmentModule,
    FetchAppointmentsPatientModule,
    DailyAppointmentModule,
    DailyAppointmentModule,
    EnrollmentDocumentsModule,
    PatientFilesModule,
    FetchPatientFilesModule,
    GetPatientModule,
    FetchPatientFilesNurseModule,
    FetchStaffFilesAdminModule,
    FileStatusModule,
    PatientStatusModule,
    PatientFilesStaffModule,
    DiagnosisModule,
    GetPatientConsultationsModule,
    EquipmentModule,
    DoctorModule,
    ChiefComplaintModule
  ],
  providers: [AppService, DoctorService, ChiefComplaintService], // ONLY services directly used by AppModule
  controllers: [AppController, DoctorController, ChiefComplaintController], // ONLY controllers directly in AppModule
})
export class AppModule { }
