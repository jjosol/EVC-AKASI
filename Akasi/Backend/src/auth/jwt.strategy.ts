// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    this.logger.log('[JWT] Payload received:', payload);

    // Define a variable to hold the user data
    let userData: any = null;

    // Check the role in the token payload
    if (payload.sub && payload.role === 'patient') {
      try {
        // Find patient (previously client)
        const patient = await this.prisma.patient.findUnique({
          where: {
            patient_id: payload.sub,
          },
        });

        if (patient) {
          userData = {
            id: patient.patient_id,        // For controllers expecting id
            patient_id: patient.patient_id, // For controllers expecting patient_id
            username: patient.username,
            grade: patient.grade,
            role: 'patient',
          };
          this.logger.debug(`[JWT] Found patient: ${patient.patient_id}`);
        }
      } catch (err) {
        this.logger.error('[JWT] Error looking up patient:', err);
      }
    } else if (payload.sub && payload.role === 'nurse') {
      try {
        // Find nurse (previously admin)
        const nurse = await this.prisma.nurse.findUnique({
          where: {
            nurse_id: payload.sub,
          },
        });

        if (nurse) {
          userData = {
            id: nurse.nurse_id,       // Consistent naming
            nurse_id: nurse.nurse_id,
            username: nurse.username,
            role: 'nurse',
          };
          this.logger.debug(`[JWT] Found nurse: ${nurse.nurse_id}`);
        }
      } catch (err) {
        this.logger.error('[JWT] Error looking up nurse:', err);
      }
    } else if (payload.sub && payload.role === 'doctor') {
      try {
        // Find doctor (new role)
        const doctor = await this.prisma.doctor.findUnique({
          where: {
            doctor_id: payload.sub,
          },
        });

        if (doctor) {
          userData = {
            id: doctor.doctor_id,
            doctor_id: doctor.doctor_id,
            username: doctor.username,
            role: 'doctor',
          };
          this.logger.debug(`[JWT] Found doctor: ${doctor.doctor_id}`);
        }
      } catch (err) {
        this.logger.error('[JWT] Error looking up doctor:', err);
      }
    }

    if (!userData) {
      this.logger.error('[JWT] No valid user found for token payload:', payload);
      throw new UnauthorizedException('Invalid token');
    }

    // Additional logging to help debug patient file access issues
    this.logger.log(`[JWT] User authenticated - ID: ${userData.id}, Role: ${userData.role}`);

    return userData;
  }
}