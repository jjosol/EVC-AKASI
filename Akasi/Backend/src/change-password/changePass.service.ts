import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChangePasswordService {
  constructor(private prisma: PrismaService) {}

  async changePasswordForDoctor(doctorId: number, currentPassword: string, newPassword: string) {
    // Find the doctor
    const doctor = await this.prisma.doctor.findFirst({
      where: { doctor_id: doctorId }
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, doctor.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update doctor password
    await this.prisma.doctor.update({
      where: { doctor_id: doctorId },
      data: { password: hashedPassword }
    });

    return { message: 'Password updated successfully' };
  }

  async changePasswordForNurse(nurseId: number, currentPassword: string, newPassword: string) {
    // Find the nurse
    const nurse = await this.prisma.nurse.findFirst({
      where: { nurse_id: nurseId }
    });

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, nurse.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update nurse password
    await this.prisma.nurse.update({
      where: { nurse_id: nurseId },
      data: { password: hashedPassword }
    });

    return { message: 'Password updated successfully' };
  }

  async changePasswordForPatient(patientId: number, currentPassword: string, newPassword: string) {
    // Find the patient
    const patient = await this.prisma.patient.findFirst({
      where: { patient_id: patientId }
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, patient.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update patient password
    await this.prisma.patient.update({
      where: { patient_id: patientId },
      data: { password: hashedPassword }
    });

    return { message: 'Password updated successfully' };
  }
}