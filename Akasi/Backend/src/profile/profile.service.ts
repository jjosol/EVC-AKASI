import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  async getProfile(userId: number, userRole: string) {
    if (userRole === 'patient') {
      return this.prisma.patient.findUnique({
        where: { patient_id: userId }
      });
    } else if (userRole === 'nurse') {
      return this.prisma.nurse.findUnique({
        where: { nurse_id: userId }
      });
    } else if (userRole === 'doctor') {
      return this.prisma.doctor.findUnique({
        where: { doctor_id: userId }
      });
    }
    return null;
  }
}