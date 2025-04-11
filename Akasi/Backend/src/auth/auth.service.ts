//auth.services.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) { }

  async login(loginDto: { username: string; password: string }) {
    const { username, password } = loginDto;

    // Find user (nurse, patient, or doctor)
    // Nurse was previously Admin
    const nurse = await this.prisma.nurse.findFirst({ where: { username } });
    // Patient was previously Client
    const patient = await this.prisma.patient.findFirst({ where: { username } });
    // Doctor is a new role
    const doctor = await this.prisma.doctor.findFirst({ where: { username } });

    const user = nurse || patient || doctor;

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Create payload based on user type
    const payload = nurse
      ? {
          sub: nurse.nurse_id,
          username: nurse.username,
          role: 'nurse'  // Previously 'admin'
        }
      : doctor
      ? {
          sub: doctor.doctor_id,
          username: doctor.username,
          role: 'doctor'  // New role
        }
      : {
          sub: patient.patient_id,
          username: patient.username,
          role: 'patient'  // Previously 'client'
        };

    const token = this.jwtService.sign(payload);

    return {
      isAuthenticated: true,
      token,
      role: payload.role
    };
  }

  async logout(token: string) {
    // You could implement token blacklisting here if needed
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
